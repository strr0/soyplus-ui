<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { fetchCaptcha } from '@/service/api';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  userName: string;
  password: string;
  code: string;
}

const model: FormModel = reactive({
  userName: '',
  password: '',
  code: ''
});

const captchaEnabled = ref(false);
const captchaImg = ref('');
const captchaUuid = ref('');

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // inside computed to make locale reactive, if not apply i18n, you can define it without computed
  const { formRules } = useFormRules();

  return {
    userName: formRules.userName,
    password: formRules.pwd,
    code: captchaEnabled.value ? formRules.code : []
  };
});

/** Get the captcha image from the RuoYi backend */
async function getCaptcha() {
  const { data, error } = await fetchCaptcha();

  if (!error) {
    captchaEnabled.value = data.captchaEnabled !== false;

    if (captchaEnabled.value) {
      // the `img` of RuoYi is a raw base64 string (without the `data:` prefix), so complete the data uri for the image src
      const img = data.img;
      captchaImg.value = img.startsWith('data:') ? img : `data:image/png;base64,${img}`;
      captchaUuid.value = data.uuid;
      model.code = '';
    }
  }
}

onMounted(() => {
  getCaptcha();
});

async function handleSubmit() {
  await validate();

  const { userName, password, code } = model;

  await authStore.login({ username: userName, password, code, uuid: captchaUuid.value });
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
    <NFormItem path="userName">
      <NInput v-model:value="model.userName" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </NFormItem>
    <NFormItem v-if="captchaEnabled" path="code">
      <div class="flex-y-center gap-12px w-full">
        <NInput
          v-model:value="model.code"
          class="flex-1"
          :placeholder="$t('page.login.codeLogin.imageCodePlaceholder')"
          @keyup.enter="handleSubmit"
        />
        <div class="h-40px w-100px cursor-pointer overflow-hidden" @click="getCaptcha">
          <NImage v-if="captchaImg" :src="captchaImg" class="h-full w-full" :preview-disabled="true" alt="captcha" />
        </div>
      </div>
    </NFormItem>
    <NSpace vertical :size="24">
      <NButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
