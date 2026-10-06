import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@routes/routes';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="Trang không tồn tại."
      extra={
        <Button type="primary" onClick={() => navigate(ROUTES.LOGIN)}>
          Về trang đăng nhập
        </Button>
      }
    />
  );
}
