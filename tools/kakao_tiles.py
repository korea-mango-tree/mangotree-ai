#!/usr/bin/env python3
# 카카오 「나에게」 실제 화면(입력 전·입력 완료·보낸 뒤 3장)을 바탕으로, 채팅방 이름·이전 대화·새 메시지를 그려 넣은
# 연출용 창 12개를 만든다. 메시지는 실제로 보낸 것이 아닌 예시 문구다(실제 회사·개인 이름 없음).
# 사용: kakao_tiles.py <작업 폴더>  (작업 폴더/raw/kt 에 원본 프레임, 작업 폴더/font 에 Pretendard)
import sys, subprocess, os
from PIL import Image, ImageDraw, ImageFont
S=sys.argv[1]; R=S+'/raw'
FM=S+'/font/Pretendard-Medium.otf'
FB=S+'/font/Pretendard-Bold.otf'
f_in=ImageFont.truetype(FM,13); f_b=ImageFont.truetype(FM,12); f_t=ImageFont.truetype(FM,11); f_h=ImageFont.truetype(FB,14); f_n=ImageFont.truetype(FM,11)
empty=Image.open(R+'/kt/s0.3.png').convert('RGB'); typed=Image.open(R+'/kt/s2.2.png').convert('RGB'); sent=Image.open(R+'/kt/s5.png').convert('RGB')
TOP=(175,193,208); ROW=(185,202,222)
MSG=[
"[메일 리마인드]\n거래처 견적 요청 메일을 확인했습니다.\n• 11/12(목)까지 견적서 회신\n우선 할 일: 견적 양식 작성 후 회신",
"[세금계산서]\n10월분 발행 요청 메일을 확인했습니다.\n• 11/11(수)까지 발행\n우선 할 일: 발행 후 담당자에게 알림",
"[미팅 일정]\n입점 미팅 확정 메일이 도착했습니다.\n• 11/13(금) 14:00 화상 회의\n우선 할 일: 회의 링크 캘린더 등록",
"[샘플 발송]\n샘플 발송 요청 메일을 확인했습니다.\n• 11/14(토) 오전 출고\n우선 할 일: 송장 번호 회신",
"[지원사업]\n서류 보완 요청 메일을 확인했습니다.\n• 11/16(월) 18:00 마감\n우선 할 일: 보완 서류 업로드",
"[계약]\n계약서 전자서명 요청이 도착했습니다.\n• 서명 기한 11/15(일)\n우선 할 일: 계약 조건 검토",
"[광고 검수]\n캠페인 검수 결과 메일이 도착했습니다.\n• 소재 1건 보완 필요\n우선 할 일: 문구 수정 후 재검수",
"[고객 문의]\n교환 요청 메일이 접수됐습니다.\n• 오늘 중 회신 권장\n우선 할 일: 교환 절차 안내",
"[정산]\n11월 1차 정산 안내 메일입니다.\n• 정산 예정일 11/20(금)\n우선 할 일: 정산 내역 확인",
"[협업 제안]\n인플루언서 협업 회신이 도착했습니다.\n• 일정 조율 요청\n우선 할 일: 가능 일정 3개 회신",
"[행사 안내]\n박람회 참가 안내 메일을 확인했습니다.\n• 11/20(금)까지 신청\n우선 할 일: 참가 신청서 제출",
"[배송]\n출고 지연 안내 요청 메일입니다.\n• 대상 주문 3건\n우선 할 일: 고객 안내 문자 발송",
]
def wrap(text,font,maxw):
    out=[]
    for para in text.split('\n'):
        line=''
        for ch in para:
            if font.getlength(line+ch)>maxw: out.append(line); line=ch.lstrip()
            else: line+=ch
        out.append(line)
    return out

ROOMS=["AI 업무 알림","영업 공유방","경영지원","마케팅 운영","CS 응대","물류 출고","재무·정산","광고 운영","고객 문의","협업 제안","행사 준비","배송 관리"]
HIST=[
 [("o","팀장","오늘 메일 정리 부탁해요","오전 9:02"),("m","네, 중요 메일만 골라서 알려드릴게요","오전 9:03")],
 [("o","김대리","견적 건 진행 상황 공유 부탁드려요","오전 10:15"),("m","메일 확인되면 바로 알려드릴게요","오전 10:16")],
 [("m","10월 매출 자료 공유드립니다","오전 8:40"),("o","박과장","확인했습니다. 발행 일정도 챙겨주세요","오전 8:52")],
 [("o","이주임","다음 주 미팅 일정 나오면 알려주세요","오후 1:20"),("m","확정 메일 오면 바로 공유할게요","오후 1:21")],
 [("o","최대리","지원사업 서류 마감 언제였죠?","오전 11:05"),("m","메일 확인해서 알려드릴게요","오전 11:06")],
 [("m","계약서 초안 검토 부탁드립니다","오후 2:10"),("o","정팀장","오늘 중으로 확인할게요","오후 2:30")],
 [("o","한주임","광고 소재 검수 결과 나왔나요?","오후 3:02"),("m","결과 메일 도착하면 공유드려요","오후 3:03")],
 [("o","상담봇","새 문의 2건이 접수되었습니다","오후 4:11"),("m","교환 요청 건 먼저 확인할게요","오후 4:12")],
 [("o","윤과장","정산 일정 다시 한번 알려주세요","오전 9:30"),("m","안내 메일 확인 후 정리할게요","오전 9:31")],
 [("o","서주임","협업 제안 답장 왔나요?","오후 5:05"),("m","도착하면 바로 알려드릴게요","오후 5:06")],
 [("o","오대리","박람회 신청 마감 체크 부탁해요","오전 10:40"),("m","안내 메일 확인 중입니다","오전 10:41")],
 [("o","배송팀","오늘 출고 지연 건이 있습니다","오후 12:10"),("m","대상 주문 확인 후 안내할게요","오후 12:11")],
]
def bubble(d,side,text,y_bottom,name=None):
    lines=wrap(text,f_b,190); h=len(lines)*17+14; w=int(max(f_b.getlength(x) for x in lines))+16
    if side=="m":
        x1=357; x0=x1-w; color=(254,229,0)
    else:
        x0=52; x1=x0+w; color=(255,255,255)
    y1=y_bottom; y0=y1-h
    d.rounded_rectangle([x0,y0,x1,y1],radius=6,fill=color)
    y=y0+7
    for ln in lines: d.text((x0+8,y),ln,font=f_b,fill=(25,25,25)); y+=17
    top=y0
    if side=="o":
        d.text((x0,y0-16),name,font=f_n,fill=(60,70,80)); top=y0-18
        d.rounded_rectangle([10,top+2,46,top+38],radius=14,fill=(204,214,224))
        d.text((20,top+12),name[0],font=f_h,fill=(255,255,255))
    return top
def chrome(img,k,bottom):
    d=ImageDraw.Draw(img)
    d.rectangle([0,0,374,bottom],fill=TOP)
    d.text((16,18),ROOMS[k],font=f_h,fill=(30,35,40))
    for i,x in enumerate((300,330)):
        d.ellipse([x,20,x+12,32],outline=(70,80,90),width=2) if i==0 else [d.line([(x,22+j*5),(x+14,22+j*5)],fill=(70,80,90),width=2) for j in range(3)]
    return d
def history(d,k,y_bottom):
    y=y_bottom
    items=HIST[(k+9)%12]+HIST[(k+5)%12]+HIST[(k+3)%12]+HIST[k]
    def tl(i):
        mm=9*60+i*23+(k*7)%20; h,m=divmod(mm,60)
        return ("오전" if h<12 else "오후")+" %d:%02d"%(h if h<=12 else h-12,m)
    for idx,item in reversed(list(enumerate(items))):
        if y<150: break
        item=item[:-1]+(tl(idx),)
        if item[0]=="m": side,text,t=item; name=None
        else: side,name,text,t=item
        top=bubble(d,side,text,y,name)
        tw=f_t.getlength(t)
        if side=="m": d.text((357-int(max(f_b.getlength(x) for x in wrap(text,f_b,190)))-16-6-tw,y-15),t,font=f_t,fill=(80,90,100))
        else: d.text((52+int(max(f_b.getlength(x) for x in wrap(text,f_b,190)))+16+6,y-15),t,font=f_t,fill=(80,90,100))
        y=top-14
    lab="2026년 11월 10일 화요일"; lw=f_n.getlength(lab)
    d.rounded_rectangle([187-lw/2-10,y-24,187+lw/2+10,y-4],radius=10,fill=(160,178,195)); d.text((187-lw/2,y-21),lab,font=f_n,fill=(255,255,255))

os.makedirs(R+'/kmsg/t',exist_ok=True)
for k,m in enumerate(MSG):
    e=empty.copy(); d=chrome(e,k,786); history(d,k,772)
    # 입력 완료 화면
    t=typed.copy(); d=chrome(t,k,618); history(d,k,604); d=ImageDraw.Draw(t)
    d.rectangle([4,622,374,858],fill=(255,255,255))
    lines=wrap(m,f_in,350); y=632
    for ln in lines: d.text((14,y),ln,font=f_in,fill=(25,25,25)); y+=19
    lx=14+f_in.getlength(lines[-1])+1; d.line([(lx,y-19),(lx,y-5)],fill=(25,25,25),width=1)
    # 보낸 화면
    s=sent.copy(); d=chrome(s,k,786)
    bl=wrap(m,f_b,226); h=len(bl)*17+16; w=int(max(f_b.getlength(x) for x in bl))+16
    x1=357; x0=x1-w; y1=769; y0=y1-h
    d.rectangle([0,y0-14,374,786],fill=ROW)
    d.rounded_rectangle([x0,y0,x1,y1],radius=6,fill=(254,229,0))
    d.polygon([(x1-6,y0),(x1+7,y0),(x1-1,y0+9)],fill=(254,229,0))
    y=y0+8
    for ln in bl: d.text((x0+8,y),ln,font=f_b,fill=(25,25,25)); y+=17
    tw=f_t.getlength('오후 11:18'); d.text((x0-6-tw,y1-15),'오후 11:18',font=f_t,fill=(80,90,100))
    history(d,k,y0-28)
    e.save(R+'/kmsg/t/%02d_0.png'%k); t.save(R+'/kmsg/t/%02d_1.png'%k); s.save(R+'/kmsg/t/%02d_2.png'%k)
print('ok')
