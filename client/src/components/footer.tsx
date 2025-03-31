import { HelpCircle, Shield, Settings } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-neutral-500 hover:text-neutral-700">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Help Center</span>
            </a>
            <a href="#" className="text-neutral-500 hover:text-neutral-700">
              <Shield className="h-5 w-5" />
              <span className="sr-only">Security</span>
            </a>
            <a href="#" className="text-neutral-500 hover:text-neutral-700">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1 text-center md:text-left">
            <p className="text-sm text-neutral-500">&copy; {new Date().getFullYear()} SecureBank. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
