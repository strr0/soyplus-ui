<script setup lang="tsx">
import { computed, defineComponent } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import type { JSX } from 'vue/jsx-runtime';
import { getServiceBaseURL } from '@/utils/service';
import { fetchBatchDeleteOss } from '@/service/api/system/oss';
import { $t } from '@/locales';
import { getToken } from '@/store/modules/auth/shared';
import { AcceptType } from '@/enum/business';

defineOptions({
  name: 'FileUpload',
  inheritAttrs: false
});

interface Props {
  action?: string;
  data?: Record<string, any>;
  defaultUpload?: boolean;
  showTip?: boolean;
  max?: number;
  accept?: string;
  fileSize?: number;
  uploadType?: 'file' | 'image';
}

const props = withDefaults(defineProps<Props>(), {
  action: `/resource/oss/upload`,
  data: undefined,
  defaultUpload: true,
  showTip: true,
  max: 5,
  accept: undefined,
  fileSize: 5,
  uploadType: 'file'
});

const accept = computed(() => {
  if (props.accept) {
    return props.accept;
  }
  return props.uploadType === 'file' ? AcceptType.File : AcceptType.Image;
});

let fileNum = 0;
const fileList = defineModel<UploadFileInfo[]>('fileList', {
  default: () => []
});

const TooltipContent = defineComponent({
  setup() {
    const tips: JSX.Element[] = [];

    if (props.max) {
      tips.push(
        <>
          {$t('component.upload.tipCount')}{' '}
          <b class="text-info">
            {props.max}
            {$t('component.upload.tipCountUnit')}
          </b>
        </>
      );
    }

    if (props.fileSize) {
      tips.push(
        <>
          {$t('component.upload.tipSize')}{' '}
          <b class="text-info">
            {props.fileSize}
            {$t('component.upload.tipSizeUnit')}
          </b>
        </>
      );
    }

    if (props.accept) {
      tips.push(
        <>
          {$t('component.upload.tipFormat')} <b class="text-info">{props.accept?.replaceAll(',', ', ')}</b>
        </>
      );
    }

    return () => (
      <NP depth={3}>
        {$t('component.upload.tipStart')}{' '}
        {tips.map((tip, index) => (
          <span>
            {tip}
            {index === tips.length - 1
              ? `${$t('component.upload.tipConnector')} `
              : `${$t('component.upload.tipSeparator')} `}
          </span>
        ))}
        {props.uploadType === 'file' ? $t('component.upload.tipFile') : $t('component.upload.tipImage')}
      </NP>
    );
  }
});

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

const headers: Record<string, string> = {
  Authorization: `Bearer ${getToken()}`,
  clientid: import.meta.env.VITE_APP_CLIENT_ID!
};

function beforeUpload(options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  fileNum += 1;
  const { file } = options;

  // 校检文件类型
  if (accept.value) {
    const fileName = file.name.split('.');
    const fileExt = `.${fileName[fileName.length - 1]}`;
    const isTypeOk = accept.value.split(',')?.includes(fileExt);
    if (!isTypeOk) {
      window.$message?.error($t('component.upload.invalidFormat', { formats: accept.value }));
      return false;
    }
  }
  // 校检文件名是否包含特殊字符
  if (file.name.includes(',')) {
    window.$message?.error($t('component.upload.invalidFileName'));
    return false;
  }
  // 校检文件大小
  if (props.fileSize && file.file?.size) {
    const isLt = file.file?.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      window.$message?.error($t('component.upload.tooLarge', { size: props.fileSize }));
      return false;
    }
  }
  return true;
}

function isErrorState(xhr: XMLHttpRequest) {
  const responseText = xhr?.responseText;
  const response = JSON.parse(responseText);
  return response.code !== 200;
}

function handleFinish(options: { file: UploadFileInfo; event?: ProgressEvent }) {
  fileNum -= 1;
  const { file, event } = options;
  // @ts-expect-error Ignore type errors
  const responseText = event?.target?.responseText;
  const response = JSON.parse(responseText);
  const oss: Api.System.Oss = response.data;
  fileList.value.find(item => item.id === file.id)!.id = String(oss.ossId);
  file.id = String(oss.ossId);
  file.url = oss.url;
  file.name = oss.fileName;
  if (fileNum === 0) {
    window.$message?.success($t('component.upload.uploadSuccess'));
  }
  return file;
}

function handleError(options: { file: UploadFileInfo; event?: ProgressEvent }) {
  const { event } = options;
  // @ts-expect-error Ignore type errors
  const responseText = event?.target?.responseText;
  const msg = JSON.parse(responseText).msg;
  window.$message?.error(msg || $t('component.upload.uploadFailed'));
}

async function handleRemove(file: UploadFileInfo) {
  if (file.status !== 'finished') {
    return false;
  }
  const { error } = await fetchBatchDeleteOss([file.id]);
  if (error) return false;
  window.$message?.success($t('common.deleteSuccess'));
  return true;
}
</script>

<template>
  <div class="w-full flex-col">
    <NUpload
      v-bind="$attrs"
      v-model:file-list="fileList"
      :action="`${baseURL}${action}`"
      :data="data"
      :headers="headers"
      :max="max"
      :accept="accept"
      :multiple="max > 1"
      directory-dnd
      :default-upload="defaultUpload"
      :list-type="uploadType === 'image' ? 'image-card' : 'text'"
      :is-error-state="isErrorState"
      @finish="handleFinish"
      @error="handleError"
      @before-upload="beforeUpload"
      @remove="({ file }) => handleRemove(file)"
    >
      <NUploadDragger v-if="uploadType === 'file'">
        <div class="mb-12px flex-center">
          <SvgIcon icon="material-symbols:unarchive-outline" class="text-58px color-#d8d8db dark:color-#a1a1a2" />
        </div>
        <NText class="text-16px">{{ $t('component.upload.dragTip') }}</NText>
        <TooltipContent v-if="showTip" class="mt-8px text-center" />
      </NUploadDragger>
      <NUploadDragger v-else>
        <SvgIcon icon="material-symbols:image-arrow-up-outline" class="text-58px color-#d8d8db dark:color-#a1a1a2" />
      </NUploadDragger>
    </NUpload>
    <TooltipContent v-if="showTip && uploadType === 'image'" class="mt-12px" />
  </div>
</template>

<style scoped></style>
