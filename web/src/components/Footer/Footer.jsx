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
      { label: "About Compare & Learn", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Educational Approach", href: "/features" },
    ],
    support: [
      { label: "Help Center", href: "/support" },
      { label: "Parent Guide", href: "/guide" },
      { label: "FAQ", href: "/faq" },
    ],
    policy: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Child Safety", href: "/safety" },
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
                    Compare & Learn
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs bg-yellow-400 text-gray-800 px-2 py-1 rounded-full font-bold animate-pulse">
                      KIDS
                    </span>
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                      EDUCATIONAL
                    </span>
                  </div>
                </div>
              </Link>

              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                The ultimate educational platform for children aged 3-18.
                Transform learning through interactive comparison games that
                develop critical thinking and problem-solving skills.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Mail size={14} />
                  </div>
                  <span className="text-white/80">
                    support@comparelearn.com
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Phone size={14} />
                  </div>
                  <span className="text-white/80">1-800-COMPARE</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <MapPin size={14} />
                  </div>
                  <span className="text-white/80">Worldwide</span>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">
                About Us
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
              <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
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
                Legal & Safety
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
              <span>© {new Date().getFullYear()} Compare & Learn.</span>
              <span className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart size={14} className="text-red-400 animate-pulse" />
                <span>for learners everywhere</span>
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/60 hidden sm:block">
                Follow us:
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
              🚀 Stay Updated!
            </h4>
            <p className="text-white/80 text-sm mb-4 max-w-md mx-auto">
              Get the latest updates, new games, and educational tips delivered
              to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email..."
                className="w-full sm:flex-1 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
              />
              <button className="px-6 py-2 bg-yellow-400 text-gray-800 rounded-full font-medium hover:bg-yellow-300 transition-all duration-300 hover:scale-105 whitespace-nowrap">
                Subscribe ✨
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
