import { transformRecordToOption } from '@/utils/common';

export const yesOrNoRecord: Record<CommonType.YesOrNo, App.I18n.I18nKey> = {
  Y: 'common.yesOrNo.yes',
  N: 'common.yesOrNo.no'
};

export const yesOrNoOptions = transformRecordToOption(yesOrNoRecord);

export const errorCodeRecord: Record<CommonType.ErrorCode, App.I18n.I18nKey> = {
  '401': 'common.errorCode.unauthorized',
  '403': 'common.errorCode.forbidden',
  '404': 'common.errorCode.notFound',
  default: 'common.errorCode.unknown'
};
