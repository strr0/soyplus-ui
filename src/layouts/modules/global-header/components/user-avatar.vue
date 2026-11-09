<script setup lang="ts">
import { computed } from 'vue';
import type { VNode } from 'vue';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import { useSvgIcon } from '@/hooks/common/icon';
import { useRouterPush } from '@/hooks/common/router';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { routerPushByKey, toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

/** display the nickName first, fallback to the login userName when it is empty, same as plus-ui */
const displayName = computed(() => authStore.userInfo.user.nickName || authStore.userInfo.user.userName);

/** the avatar url of the user, empty when the user does not upload an avatar */
const avatarUrl = computed(() => authStore.userInfo.user.avatarUrl || '');

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  ];

  return opts;
});

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      authStore.logout();
    }
  });
}

function handleDropdown(key: DropdownKey) {
  if (key === 'logout') {
    logout();
  } else {
    // If your other options are jumps from other routes, they will be directly supported here
    routerPushByKey(key);
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <NDropdown v-else placement="bottom" trigger="click" :options="options" @select="handleDropdown">
    <div>
      <ButtonIcon>
        <div class="flex-y-center gap-8px">
          <NAvatar round :size="28" :src="avatarUrl" class="shrink-0">
            <SvgIcon icon="ph:user-circle" class="text-20px" />
          </NAvatar>
          <span class="text-16px font-medium">{{ displayName }}</span>
        </div>
      </ButtonIcon>
    </div>
  </NDropdown>
</template>

<style scoped></style>
