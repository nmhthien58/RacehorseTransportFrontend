import { DatePicker, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatExamWindow, isIssueDateDisabled, isPostClearance } from '@utils/fitExam';

/**
 * Ô ngày trong form nộp giấy: giấy khám (FIT_EXAM) cần Ngày cấp bắt buộc trong khoảng 48 giờ,
 * các giấy khác có Ngày hết hạn tùy chọn.
 * @param {Object} props
 * @param {Object|null} props.item - Dòng checklist đang nộp
 * @returns {JSX.Element}
 */
export default function DocumentDateField({ item }) {
  const { t } = useTranslation();

  if (isPostClearance(item)) {
    const window = formatExamWindow(item);
    return (
      <Form.Item
        name="issueDate"
        label={t('fitExam.issueDate')}
        rules={[{ required: true, message: t('fitExam.issueDateRequired') }]}
        extra={window ? t('fitExam.window', { window }) : null}
      >
        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(d) => isIssueDateDisabled(d, item)} />
      </Form.Item>
    );
  }

  return (
    <Form.Item name="expiryDate" label={t('customerDossier.expiryDate')}>
      <DatePicker
        style={{ width: '100%' }}
        format="DD/MM/YYYY"
        disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
      />
    </Form.Item>
  );
}
