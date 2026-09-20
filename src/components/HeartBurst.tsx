import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface HeartBurstProps {
  show: boolean;
  x?: number;
  y?: number;
}

export default function HeartBurst({ show }: HeartBurstProps) {
  return (
    <AnimatePresence>
      {show && (
        <div
          id="heart-burst-container"
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden"
        >
          {/* Main big pulsing heart */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{
              scale: [0, 1.35, 1.05],
              opacity: [0, 1, 0.95],
              rotate: [-15, 8, 0],
            }}
            exit={{
              scale: 1.45,
              opacity: 0,
              y: -50,
              transition: { duration: 0.45, ease: 'easeOut' },
            }}
            transition={{
              duration: 0.35,
              times: [0, 0.6, 1],
              ease: 'easeOut',
            }}
            className="relative flex items-center justify-center drop-shadow-[0_10px_25px_rgba(239,68,68,0.7)]"
          >
            <Heart className="w-28 h-28 text-red-500 fill-red-500 filter drop-shadow-lg" />

            {/* Glowing radial halo behind heart */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 blur-xl pointer-events-none"
            />
          </motion.div>

          {/* Orbiting micro sparkle hearts */}
          {[
            { angle: -45, dist: 70, delay: 0.05, size: 'w-6 h-6' },
            { angle: 35, dist: 80, delay: 0.1, size: 'w-5 h-5' },
            { angle: 120, dist: 65, delay: 0.08, size: 'w-4 h-4' },
            { angle: -130, dist: 75, delay: 0.12, size: 'w-5 h-5' },
          ].map((spark, idx) => {
            const rad = (spark.angle * Math.PI) / 180;
            const targetX = Math.cos(rad) * spark.dist;
            const targetY = Math.sin(rad) * spark.dist;

            return (
              <motion.div
                key={idx}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: targetX,
                  y: targetY - 20,
                  scale: [0, 1.2, 0.8],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 0.65,
                  delay: spark.delay,
                  ease: 'easeOut',
                }}
                className="absolute pointer-events-none text-rose-400 fill-rose-400 drop-shadow-md"
              >
                <Heart className={spark.size} />
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
