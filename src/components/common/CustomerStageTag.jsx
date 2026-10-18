import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { CUSTOMER_STAGE_COLOR } from '@features/customer/constants/customerStages';

/**
 * Tag giai đoạn của đơn theo góc nhìn khách (trường `customerStage`, R-07).
 * @param {Object} props
 * @param {string} [props.stage]
 * @returns {JSX.Element|null}
 */
export default function CustomerStageTag({ stage }) {
  const { t } = useTranslation();
  if (!stage) return null;
  return (
    <Tag color={CUSTOMER_STAGE_COLOR[stage] || 'default'} style={{ margin: 0 }}>
      {t(`customerOrders.stage.${stage}`, stage)}
    </Tag>
  );
}
