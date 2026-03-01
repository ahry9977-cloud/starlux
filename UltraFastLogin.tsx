                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                dir="ltr"
                style={{ paddingLeft: '3rem' }}
              />
              <button 
                type="button" 
                className="ufl-pwd-toggle"
                onClick={togglePwd}
                aria-label={showPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPwd ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>

            <button 
              type="submit" 
              className="ufl-btn"
              disabled={loading}
            >
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="ufl-footer">
            <a href="/forgot-password" className="ufl-link">نسيت كلمة المرور؟</a>
            <a href="/terms" className="ufl-link">شروط الاستخدام</a>
          </div>
        </div>
      </div>
    </>
  );
});

UltraFastLogin.displayName = 'UltraFastLogin';

export default UltraFastLogin;
