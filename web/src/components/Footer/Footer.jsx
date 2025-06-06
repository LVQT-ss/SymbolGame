import React from "react";
import { Link } from "react-router-dom";
import {
  BsFacebook,
  BsInstagram,
  BsTwitter,
  BsGithub,
  BsDribbble,
  BsYoutube,
} from "react-icons/bs";
import { Mail, MapPin, Phone, Heart } from "lucide-react";

export default function FooterCom() {
  const footerLinks = {
    about: [
      { label: "Giới thiệu về CompareKids", href: "/about" },
      { label: "Tính năng nổi bật", href: "/features" },
      { label: "Cách thức hoạt động", href: "/how-it-works" },
    ],
    support: [
      { label: "Hỗ trợ khách hàng", href: "/support" },
      { label: "Hướng dẫn sử dụng", href: "/guide" },
      { label: "Câu hỏi thường gặp", href: "/faq" },
    ],
    policy: [
      { label: "Chính sách bảo mật", href: "/privacy" },
      { label: "Điều khoản sử dụng", href: "/terms" },
      { label: "Chính sách cookie", href: "/cookies" },
    ],
  };

  const socialLinks = [
    {
      icon: BsFacebook,
      href: "https://www.facebook.com/profile.php?id=61570585160116",
      label: "Facebook",
      color: "hover:text-blue-400",
    },
    {
      icon: BsGithub,
      href: "https://github.com/LVQT-ss",
      label: "GitHub",
      color: "hover:text-gray-400",
    },
    {
      icon: BsYoutube,
      href: "#",
      label: "YouTube",
      color: "hover:text-red-400",
    },
    {
      icon: BsTwitter,
      href: "#",
      label: "Twitter",
      color: "hover:text-blue-400",
    },
  ];

  return (
    <footer className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 opacity-30">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center space-x-2 group mb-6">
                <span className="text-3xl group-hover:animate-bounce transition-all duration-300">
                  🎯
                </span>
                <div>
                  <span className="text-2xl font-bold text-white">
                    CompareKids
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs bg-yellow-400 text-gray-800 px-2 py-1 rounded-full font-bold animate-pulse">
                      FUN
                    </span>
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                      PRO
                    </span>
                  </div>
                </div>
              </Link>

              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                Nền tảng giáo dục trực tuyến hàng đầu dành cho trẻ em, giúp phát
                triển kỹ năng và kiến thức qua các trò chơi thú vị.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Mail size={14} />
                  </div>
                  <span className="text-white/80">support@comparekids.com</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Phone size={14} />
                  </div>
                  <span className="text-white/80">+84 123 456 789</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <MapPin size={14} />
                  </div>
                  <span className="text-white/80">Việt Nam</span>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">
                Về chúng tôi
              </h3>
              <ul className="space-y-3">
                {footerLinks.about.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-white/80 hover:text-yellow-300 transition-all duration-300 text-sm hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Section */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Hỗ trợ</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-white/80 hover:text-yellow-300 transition-all duration-300 text-sm hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policy Section */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">
                Chính sách
              </h3>
              <ul className="space-y-3">
                {footerLinks.policy.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-white/80 hover:text-yellow-300 transition-all duration-300 text-sm hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20"></div>

        {/* Bottom Footer */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-white/80">
              <span>© {new Date().getFullYear()} CompareKids.</span>
              <span className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart size={14} className="text-red-400 animate-pulse" />
                <span>by Máy Tính QT</span>
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/60 hidden sm:block">
                Theo dõi chúng tôi:
              </span>
              <div className="flex items-center space-x-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    className={`p-2 bg-white/10 rounded-full transition-all duration-300 hover:scale-110 hover:bg-white/20 ${social.color}`}
                  >
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section (Optional) */}
        <div className="border-t border-white/20 py-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-3 text-white">
              Đăng ký nhận thông tin mới nhất
            </h4>
            <p className="text-white/80 text-sm mb-4 max-w-md mx-auto">
              Nhận những cập nhật mới nhất về tính năng và hoạt động giáo dục
              thú vị cho bé.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                className="w-full sm:flex-1 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
              />
              <button className="px-6 py-2 bg-yellow-400 text-gray-800 rounded-full font-medium hover:bg-yellow-300 transition-all duration-300 hover:scale-105 whitespace-nowrap">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
