import React from 'react';
import Header from '../components/Header';
import { GitBranch, Rocket, FileText, ChevronRight, Layers } from 'lucide-react';

export default function Profile() {
  const links = [
    {
      title: 'GitHub Repository',
      url: 'github.com/dangxuanquang/iot-dashboard',
      href: 'https://github.com/dangxuanquang/iot-dashboard',
      icon: GitBranch,
      color: 'bg-slate-50 text-slate-700'
    },
    {
      title: 'Figma Design File',
      url: 'figma.com/file/contra-labs-iot',
      href: 'https://figma.com',
      icon: Layers,
      color: 'bg-orange-50 text-orange-500'
    },
    {
      title: 'Postman API Docs',
      url: 'postman.com/workspace/contra-iot',
      href: 'https://postman.com',
      icon: Rocket,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Báo cáo tiểu luận',
      url: 'drive.google.com/share/baocao-iot.pdf',
      href: 'https://drive.google.com',
      icon: FileText,
      color: 'bg-blue-50 text-blue-500'
    }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <Header title="Profile" subtitle="Thông tin cá nhân và tài liệu liên quan đến dự án" />

      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 card-hover">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col items-center text-center pb-8 border-b border-slate-100">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full p-1 ring-4 ring-blue-500/20 overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                  alt="Đặng Xuân Quang"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://ui-avatars.com/api/?name=Dang+Xuan+Quang&background=3b82f6&color=fff&size=128';
                  }}
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Đặng Xuân Quang</h2>
            <span className="mt-1 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
              Lớp: D23CNPM06
            </span>

            {/* Student Details Grid */}
            <div className="grid grid-cols-2 gap-6 w-full mt-6 pt-6 border-t border-slate-100/80 bg-slate-50/50 p-4 rounded-2xl">
              <div>
                <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">MÃ SINH VIÊN</span>
                <span className="text-sm font-mono font-bold text-slate-800 mt-1 block">B23DCCN686</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">CHUYÊN NGÀNH</span>
                <span className="text-sm font-bold text-blue-600 mt-1 block">Công nghệ phần mềm</span>
              </div>
            </div>
          </div>

          {/* Project & Document Links Section */}
          <div className="pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">LIÊN KẾT DỰ ÁN & TÀI LIỆU</h3>

            <div className="space-y-3">
              {links.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <a
                    key={idx}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${link.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {link.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{link.url}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
