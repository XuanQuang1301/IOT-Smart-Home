import React from 'react';
import Header from '../components/Header';
import avatarImg from '../assets/avatar.png';

export default function Profile() {
  const links = [
    {
      title: 'GitHub Repository',
      url: 'https://github.com/XuanQuang1301/IOT-Smart-Home',
      href: 'https://github.com/XuanQuang1301/IOT-Smart-Home',
      badge: 'Git'
    },
    {
      title: 'Figma Design File',
      url: 'figma.com/file/contra-labs-iot',
      href: 'https://www.figma.com/design/bp3cfY9WkXlfF5lN4PreqN/Untitled?node-id=0-1&t=FEGKawTyiA9gA240-1',
      badge: 'Figma'
    },
    {
      title: 'Postman API Docs',
      url: 'postman.com/workspace/contra-iot',
      href: 'https://postman.com',
      badge: 'API'
    },
    {
      title: 'Báo cáo tiểu luận',
      url: 'drive.google.com/share/baocao-iot.pdf',
      href: 'https://drive.google.com',
      badge: 'PDF'
    }
  ];

  return (
    <div className="h-full p-5 overflow-y-auto flex flex-col justify-between">
      <div>
        <Header title="Profile" subtitle="Thông tin cá nhân và tài liệu liên quan đến dự án" />

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full p-1 ring-2 ring-blue-500/20 overflow-hidden bg-slate-100 shadow-sm">
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

              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Đặng Xuân Quang</h2>
              <span className="mt-0.5 px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-semibold rounded-full">
                Lớp: D23CNPM06
              </span>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-3 border-t border-slate-100/80 bg-slate-50/50 p-3 rounded-xl text-left">
                <div>
                  <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">MÃ SINH VIÊN</span>
                  <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block">B23DCCN686</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">CHUYÊN NGÀNH</span>
                  <span className="text-xs font-bold text-blue-600 mt-0.5 block">Công nghệ phần mềm</span>
                </div>
              </div>
            </div>

            {/* Project & Document Links Section (No Icons) */}
            <div className="pt-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">LIÊN KẾT DỰ ÁN & TÀI LIỆU</h3>

              <div className="space-y-2">
                {links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 hover:border-slate-200 transition-all group"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {link.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{link.url}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-md group-hover:border-blue-300 group-hover:text-blue-600">
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
