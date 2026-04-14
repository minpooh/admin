import logo from '../assets/FEEL_logo.png';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [ipAddress, setIpAddress] = useState('확인 중...');

  useEffect(() => {
    const controller = new AbortController();

    fetch('https://api.ipify.org?format=json', { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { ip?: string }) => {
        setIpAddress(data.ip ?? '확인 불가');
      })
      .catch(() => {
        setIpAddress('확인 불가');
      });

    return () => controller.abort();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/home');
  };

  return (
    <main className="login-page">
      <div className="login-header">
        <img src={logo} alt="FEEL logo" className="login-logo" />
        <h1>FEEL 관리자 로그인</h1>
      </div>
      <section className="login-card" aria-label="관리자 로그인">
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            아이디
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="아이디를 입력해 주세요"
              required
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력해 주세요"
              required
            />
          </label>
          <button type="submit">로그인</button>
        </form>
        <button type="button" className="login-request-btn">
          관리자 권한 요청
        </button>
      </section>
      <p className="login-ip-text">IP 주소: {ipAddress}</p>
    </main>
  );
}
