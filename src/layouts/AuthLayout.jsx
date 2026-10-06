import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

import authHorse1 from '@/assets/auth/auth-horse-1.webp';
import authHorse2 from '@/assets/auth/auth-horse-2.webp';
import authHorse3 from '@/assets/auth/auth-horse-3.webp';
import authHorse4 from '@/assets/auth/auth-horse-4.webp';

const SLIDES = [authHorse1, authHorse2, authHorse3, authHorse4];
const SLIDE_DURATION_MS = 30000; // 30 giây mỗi ảnh

/**
 * Layout cho toàn bộ luồng Authentication (Login, Register, Forgot Password, Verify Code, Reset Password).
 * Đảm bảo banner ảnh bên phải chiếm ưu thế (56-58% màn hình) và bộ đếm 30s KHÔNG bị reload hay reset khi chuyển trang.
 */
export default function AuthLayout() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.authContainer}>
      {/* Cột trái: Form xác thực (Login, Register, Forgot Password,...) */}
      <div className={styles.leftColumn}>
        <div className={styles.formWrapper}>
          <Outlet />
        </div>
      </div>

      {/* Cột phải: Banner ảnh ngựa đua chiếm nhiều diện tích hơn, tự động chuyển ảnh mỗi 30s không reload */}
      <div className={styles.rightColumn}>
        <div className={styles.bannerCard}>
          {SLIDES.map((slideImg, index) => {
            const isActive = index === activeIndex;
            return (
              <img
                key={slideImg}
                src={slideImg}
                alt="International Equine Transport Champion"
                className={`${styles.imageSlide} ${isActive ? styles.imageSlideActive : ''}`}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
