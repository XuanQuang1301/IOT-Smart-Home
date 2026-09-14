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
    <div className="flex-1 p-5 overflow-y-auto min-h-screen flex flex-col justify-between animate-fade-in">
      <div>
        <Header title="Profile" subtitle="Thông tin cá nhân và tài liệu liên quan đến dự án" />

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 card-hover">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full p-1 ring-2 ring-blue-500/20 overflow-hidden bg-slate-100">
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

            {/* Project & Document Links Section */}
            <div className="pt-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">LIÊN KẾT DỰ ÁN & TÀI LIỆU</h3>

              <div className="space-y-2">
                {links.map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={idx}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 hover:border-slate-200 transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${link.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {link.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{link.url}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
