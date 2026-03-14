import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
  skipInitialFetch?: boolean; // تخطي الطلب الأولي للصفحات العامة
};

// Cache للمستخدم في الذاكرة
let cachedUser: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

// الحصول على المستخدم من localStorage
function getCachedUser() {
  if (typeof window === 'undefined') return null;
  
  // التحقق من الذاكرة أولاً
  if (cachedUser && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedUser;
  }
  
  try {
    const stored = localStorage.getItem('manus-runtime-user-info');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed) {
        cachedUser = parsed;
        cacheTimestamp = Date.now();
        return parsed;
      }
    }
  } catch {
    // تجاهل أخطاء JSON
  }
  return null;
}

// تحديث الـ cache
function updateCache(user: any) {
  cachedUser = user;
  cacheTimestamp = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem('manus-runtime-user-info', JSON.stringify(user));
  }
}

export function useAuthOptimized(options?: UseAuthOptions) {
  const { 
    redirectOnUnauthenticated = false, 
    redirectPath = getLoginUrl(),
    skipInitialFetch = false 
  } = options ?? {};
  
  const utils = trpc.useUtils();
  const initialFetchDone = useRef(false);
  
  // استخدام الـ cache كقيمة أولية
  const [initialUser] = useState(() => getCachedUser());

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // تخطي الطلب إذا كان لدينا cache صالح أو تم طلب التخطي
    enabled: !skipInitialFetch && !initialFetchDone.current,
    // استخدام الـ cache كقيمة أولية
    initialData: initialUser,
    // تقليل وقت الـ stale
    staleTime: CACHE_DURATION,
    // تقليل وقت الـ cache
    gcTime: CACHE_DURATION * 2,
  });

  // تحديث الـ cache عند تغيير البيانات
  useEffect(() => {
    if (meQuery.data !== undefined) {
      updateCache(meQuery.data);
      initialFetchDone.current = true;
    }
  }, [meQuery.data]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      updateCache(null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      updateCache(null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // استخدام الـ cache إذا كان الطلب جارياً
    const user = meQuery.data ?? initialUser ?? null;
    
    return {
      user,
      // التحميل فقط إذا لم يكن لدينا cache
      loading: !initialUser && (meQuery.isLoading || logoutMutation.isPending),
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    initialUser,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    state.loading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {
      initialFetchDone.current = false;
      return meQuery.refetch();
    },
    logout,
  };
}

// تصدير الـ hook الأصلي للتوافق
export { useAuthOptimized as useAuth };
