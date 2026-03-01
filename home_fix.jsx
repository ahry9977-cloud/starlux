                  {(user?.role === 'admin' || user?.role === 'sub_admin') && (
                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold" size="sm" onClick={() => navigate('/admin-dashboard')}>
                      لوحة التحكم
                    </Button>
                  )}
                  {user?.role === 'seller' && (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" size="sm" onClick={() => navigate('/seller-dashboard')}>
                      لوحة البائع
                    </Button>
                  )}
