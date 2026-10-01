import { readonly, ref } from 'vue'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'wepush.theme'

// index.html applies the stored or OS theme before paint; this mirrors it.
function current(): Theme {
  const applied = document.documentElement.dataset.theme
  if (applied === 'light' || applied === 'dark')
    return applied
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const theme = ref<Theme>(current())

function apply(next: Theme) {
  theme.value = next
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  }
  catch {}
}

export function useTheme() {
  return {
    theme: readonly(theme),
    toggle: () => apply(theme.value === 'dark' ? 'light' : 'dark'),
  }
}
