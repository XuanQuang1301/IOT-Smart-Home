import React from 'react';
import Header from '../components/Header';
import avatarImg from '../assets/avatar.png';

export default function Profile() {
  const links = [
    {
      title: 'GitHub Repository',
      url: 'https://github.com/XuanQuang1301/IOT-Smart-Home',
      href: 'https://github.com/XuanQuang1301/IOT-Smart-Home',
      badge: 'Git',
      badgeStyle: 'bg-slate-900 text-white border-slate-800',
      hoverBorder: 'hover:border-slate-800 hover:bg-slate-50/70'
    },
    {
      title: 'Figma Design File',
      url: 'figma.com/file/contra-labs-iot',
      href: 'https://www.figma.com/design/bp3cfY9WkXlfF5lN4PreqN/Untitled?node-id=0-1&t=FEGKawTyiA9gA240-1',
      badge: 'Figma',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
      hoverBorder: 'hover:border-purple-400 hover:bg-purple-50/40'
    },
    {
      title: 'Postman API Docs',
      url: 'postman.com/workspace/contra-iot',
      href: 'https://postman.com',
      badge: 'API',
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      hoverBorder: 'hover:border-amber-400 hover:bg-amber-50/40'
    },
    {
      title: 'Báo cáo tiểu luận',
      url: 'drive.google.com/share/baocao-iot.pdf',
      href: 'https://drive.google.com',
      badge: 'PDF',
      badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200',
      hoverBorder: 'hover:border-rose-400 hover:bg-rose-50/40'
    }
  ];

  return (
    <div className="h-full p-5 overflow-y-auto flex flex-col justify-between">
      <div>
        <Header title="Profile" subtitle="Thông tin cá nhân và tài liệu liên quan đến dự án" />

        <div className="max-w-md mx-auto my-2">
          {/* Main Container Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-200">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full p-1 ring-4 ring-blue-500/20 overflow-hidden bg-white shadow-md">
                  <img
                    src={avatarImg}
                    alt="Đặng Xuân Quang"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://ui-avatars.com/api/?name=Dang+Xuan+Quang&background=3b82f6&color=fff&size=128';
                    }}
                  />
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Đặng Xuân Quang</h2>
              <span className="mt-1 px-3 py-0.5 bg-blue-100/80 text-blue-700 text-xs font-bold rounded-full border border-blue-200/60 shadow-2xs">
                Lớp: D23CNPM06
              </span>

              {/* Student Details Box (High Contrast Clear Box) */}
              <div className="grid grid-cols-2 gap-3 w-full mt-4 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-left shadow-2xs">
                <div className="border-r border-slate-200/80 pr-2">
                  <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">MÃ SINH VIÊN</span>
                  <span className="text-xs font-mono font-extrabold text-slate-900 mt-0.5 block">B23DCCN686</span>
                </div>
                <div className="pl-1">
                  <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">CHUYÊN NGÀNH</span>
                  <span className="text-xs font-bold text-blue-600 mt-0.5 block">Công nghệ phần mềm</span>
                </div>
              </div>
            </div>

            {/* Project & Document Links Section (Distinct Framed Cards) */}
            <div className="pt-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">LIÊN KẾT DỰ ÁN & TÀI LIỆU</h3>

              <div className="space-y-2.5">
                {links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all group ${link.hoverBorder}`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {link.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{link.url}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold rounded-lg shadow-2xs shrink-0 ${link.badgeStyle}`}>
                      {link.badge}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
