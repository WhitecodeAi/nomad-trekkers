import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Mountain,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";

interface FooterContent {
  id: number;
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  quickLinks: Array<{
    name: string;
    url: string;
  }>;
  updatedAt: string;
}

export default function Footer() {
  const [footerContent, setFooterContent] = useState<FooterContent | null>(
    null,
  );

  useEffect(() => {
    fetchFooterContent();
  }, []);

  const fetchFooterContent = async () => {
    try {
      const response = await fetch("/api/admin/footer-content");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFooterContent(data.data);
        } else {
          // Use default content if no custom content exists
          setDefaultFooterContent();
        }
      } else {
        setDefaultFooterContent();
      }
    } catch (error) {
      console.error("Error fetching footer content:", error);
      setDefaultFooterContent();
    }
  };

  const setDefaultFooterContent = () => {
    setFooterContent({
      id: 0,
      aboutText:
        "NomadTrekkers helps you discover and explore the magnificent forts of Maharashtra. Plan your treks, read reviews, and connect with fellow trekkers for unforgettable adventures.",
      contactEmail: "contact@nomadtrekkers.org",
      contactPhone: "+91 9876543210",
      address: "Pune, Maharashtra, India",
      socialLinks: {
        facebook: "https://www.facebook.com/NomadTrekkers/",
        twitter: "https://twitter.com/nomadtrekkers",
        instagram: "https://instagram.com/nomadtrekkers",
        youtube: "https://youtube.com/nomadtrekkers",
      },
      quickLinks: [
        { name: "About Us", url: "/about" },
        { name: "All Forts", url: "/forts" },
        { name: "Trek Planner", url: "/trek-planner" },
        { name: "Find Groups", url: "/trek-groups" },
        { name: "Guides", url: "/guides" },
        { name: "Contact", url: "/contact" },
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  if (!footerContent) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & About */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/logo.png" alt="Nomad Trekkers Logo" className="h-10 w-10 rounded-full object-cover ring-2 ring-orange-500/30" />
              <span className="text-2xl font-bold">Nomad Trekkers</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-md">
              {footerContent.aboutText}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-orange-500" />
                <a
                  href={`mailto:${footerContent.contactEmail}`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {footerContent.contactEmail}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-orange-500" />
                <a
                  href={`tel:${footerContent.contactPhone}`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {footerContent.contactPhone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-gray-300 text-sm">
                  {footerContent.address}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerContent.quickLinks && Array.isArray(footerContent.quickLinks) && footerContent.quickLinks.map((link, index) => (
                <li key={index}>
                  {link.url.startsWith("http") ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors text-sm flex items-center"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  ) : (
                    <Link
                      to={link.url}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {footerContent.socialLinks?.facebook && (
                <a
                  href={footerContent.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {footerContent.socialLinks?.twitter && (
                <a
                  href={footerContent.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {footerContent.socialLinks?.instagram && (
                <a
                  href={footerContent.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {footerContent.socialLinks?.youtube && (
                <a
                  href={footerContent.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>

            {/* Newsletter Signup */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Stay Updated</h4>
              <p className="text-gray-400 text-xs mb-3">
                Get the latest trek updates and fort information
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button className="px-4 py-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600 transition-colors text-sm">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Nomad Trekkers. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-white text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-gray-400 hover:text-white text-sm"
              >
                Terms of Service
              </Link>
              <Link
                to="/sitemap"
                className="text-gray-400 hover:text-white text-sm"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
