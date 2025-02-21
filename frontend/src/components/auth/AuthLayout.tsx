import { Opulento } from "uvcanvas";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRegisterPage = pathname === '/register';

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Back Button */}
      <motion.button
        onClick={() => router.push('/')}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-white/80 hover:text-white transition-colors group px-4 p-2 rounded-full bg-black/50 backdrop-blur-md"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        <span className="text-lg">Back to Home</span>
      </motion.button>

      {/* Full width Opulento */}
      <div className="absolute inset-0">
        <Opulento />
      </div>

      {/* Animated form container */}
      <motion.div 
        initial={{ x: isRegisterPage ? '100%' : '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: isRegisterPage ? '-100%' : '100%' }}
        transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
        className="absolute top-0 h-full w-1/2"
        style={{
          left: isRegisterPage ? '0' : '50%'
        }}
      >
        <motion.div 
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
        <div className="relative h-full flex items-center justify-center">
          <motion.div 
            className="w-full max-w-md px-8 border border-white/20 rounded-2xl shadow-lg py-12 bg-black/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 