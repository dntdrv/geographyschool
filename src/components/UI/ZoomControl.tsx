import { Plus, Minus, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import './ZoomControl.css';

interface ZoomControlProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onLocateMe?: () => void;
}

const spring: any = {
    type: "spring",
    stiffness: 300,
    damping: 20
};

const ZoomControl: React.FC<ZoomControlProps> = ({ onZoomIn, onZoomOut, onLocateMe }) => {
    return (
        <div className="zoom-control-container">
            {onLocateMe && (
                <motion.button
                    className="zoom-btn glass-panel"
                    onClick={onLocateMe}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    transition={spring}
                    title="Locate Me"
                >
                    <Navigation size={20} />
                </motion.button>
            )}

            <motion.button
                className="zoom-btn glass-panel"
                onClick={onZoomIn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                title="Zoom In"
            >
                <Plus size={20} />
            </motion.button>
            <motion.button
                className="zoom-btn glass-panel"
                onClick={onZoomOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                title="Zoom Out"
            >
                <Minus size={20} />
            </motion.button>
        </div>
    );
};

export default ZoomControl;
