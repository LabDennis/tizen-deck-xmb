"""Build and sign this local WGT using the official SDK's public test signer."""
from pathlib import Path
import base64,datetime,hashlib,zipfile,os
from lxml import etree as E
from cryptography import x509
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import rsa,padding
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID,ExtendedKeyUsageOID
HERE=Path(__file__).resolve().parent
SDK=HERE/'.deps/certificate-generator/data/tools/certificate-generator/certificates'
STATE=HERE/'.signing';STATE.mkdir(mode=0o700,exist_ok=True)
keyfile=STATE/'author.key';certfile=STATE/'author.pem'
if not keyfile.exists():
 key=rsa.generate_private_key(public_exponent=65537,key_size=2048)
 keyfile.write_bytes(key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption()));keyfile.chmod(0o600)
else:key=serialization.load_pem_private_key(keyfile.read_bytes(),None)
ca=x509.load_pem_x509_certificate((SDK/'developer/tizen-developer-ca.cer').read_bytes())
if not certfile.exists():
 cakey=serialization.load_pem_private_key((SDK/'developer/tizen-developer-ca-privatekey.pem').read_bytes(),b'tizencertificatefordevelopercaroqkfwk')
 now=datetime.datetime.now(datetime.timezone.utc)
 cert=x509.CertificateBuilder().subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'Tizen Deck local author')])).issuer_name(ca.subject).public_key(key.public_key()).serial_number(x509.random_serial_number()).not_valid_before(now-datetime.timedelta(days=1)).not_valid_after(now+datetime.timedelta(days=365)).add_extension(x509.BasicConstraints(ca=False,path_length=None),True).add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.CODE_SIGNING]),False).sign(cakey,hashes.SHA256())
 certfile.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
else:cert=x509.load_pem_x509_certificate(certfile.read_bytes())
dkey,dcert,dchain=pkcs12.load_key_and_certificates((SDK/'distributor/sdk-public/tizen-distributor-signer.p12').read_bytes(),b'tizenpkcs12passfordsigner')
NS='http://www.w3.org/2000/09/xmldsig#';DSP='http://www.w3.org/2009/xmldsig-properties'
def node(parent,name,text=None,**attrs):
 e=E.SubElement(parent,'{'+NS+'}'+name,**attrs);e.text=text;return e
def canon(e):return E.tostring(e,method='c14n',exclusive=True)
def b64(x):return base64.b64encode(x).decode()
def sign(files,kind,key,certs):
 ident=kind+'Signature';root=E.Element('{'+NS+'}Signature',nsmap={None:NS},Id=ident)
 si=node(root,'SignedInfo');node(si,'CanonicalizationMethod',Algorithm='http://www.w3.org/2001/10/xml-exc-c14n#');node(si,'SignatureMethod',Algorithm='http://www.w3.org/2001/04/xmldsig-more#rsa-sha256')
 def ref(uri,data,prop=False):
  r=node(si,'Reference',URI=uri)
  if prop:node(node(r,'Transforms'),'Transform',Algorithm='http://www.w3.org/2001/10/xml-exc-c14n#')
  node(r,'DigestMethod',Algorithm='http://www.w3.org/2001/04/xmlenc#sha256');node(r,'DigestValue',b64(hashlib.sha256(data).digest()))
 for name,data in sorted(files.items()):ref(name,data)
 val=node(root,'SignatureValue');ki=node(root,'KeyInfo');xd=node(ki,'X509Data')
 for c in certs:node(xd,'X509Certificate',b64(c.public_bytes(serialization.Encoding.DER)))
 obj=node(root,'Object',Id='prop');props=node(obj,'SignatureProperties')
 for name,uri in [('Profile','http://www.w3.org/ns/widgets-digsig#profile'),('Role','http://www.w3.org/ns/widgets-digsig#role-'+kind.lower()),('Identifier',None)]:
  prop=node(props,'SignatureProperty',Id=name.lower(),Target='#'+ident)
  e=E.SubElement(prop,'{'+DSP+'}'+name,nsmap={'dsp':DSP})
  if uri:e.set('URI',uri)
 ref('#prop',canon(obj),True);val.text=b64(key.sign(canon(si),padding.PKCS1v15(),hashes.SHA256()))
 key.public_key().verify(base64.b64decode(val.text),canon(si),padding.PKCS1v15(),hashes.SHA256())
 return E.tostring(root,xml_declaration=True,encoding='UTF-8')
files={p.relative_to(HERE/'src').as_posix():p.read_bytes() for p in (HERE/'src').rglob('*') if p.is_file()}
if os.environ.get('DECK_DEVICE_CONFIG'):
 files['device-config.js']=Path(os.environ['DECK_DEVICE_CONFIG']).read_bytes()
files['author-signature.xml']=sign(files,'Author',key,[cert,ca])
files['signature1.xml']=sign(files,'Distributor',dkey,[dcert]+list(dchain or []))
with zipfile.ZipFile(HERE/'TizenDeckX.wgt','w',zipfile.ZIP_DEFLATED) as z:
 for name,data in files.items():z.writestr(name,data)
print('Signed package:',HERE/'TizenDeckX.wgt')
