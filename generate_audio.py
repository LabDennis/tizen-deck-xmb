import math,wave,struct
from pathlib import Path
base=Path(__file__).resolve().parent/'src/audio';base.mkdir(exist_ok=True)
rate=44100
for name,duration in [('click',.075),('intro',1.35)]:
 values=[]
 for i in range(int(rate*duration)):
  t=i/rate
  if name=='click':
   env=min(1,t/.003)*math.exp(-t*85)*min(1,(duration-t)/.012)
   v=.24*env*(.7*math.sin(2*math.pi*1150*t)+.3*math.sin(2*math.pi*1725*t))
  else:
   v=0
   for freq,start in [(261.63,0),(392,.12),(523.25,.24),(783.99,.36)]:
    u=t-start
    if u>=0:v+=.065*(1-math.exp(-u*20))*math.exp(-u*2.8)*math.sin(2*math.pi*freq*u)
   v*=min(1,(duration-t)/.25)
  values.append(struct.pack('<h',max(-32767,min(32767,int(v*32767)))))
 with wave.open(str(base/(name+'.wav')),'wb') as w:w.setparams((1,2,rate,len(values),'NONE','not compressed'));w.writeframes(b''.join(values))
