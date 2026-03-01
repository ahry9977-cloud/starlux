                              <p className="text-white font-medium">${product.salePrice}</p>
                              {product.salePrice < product.price && (
                                <p className="text-slate-500 text-sm line-through">${product.price}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(product.status, 'product')}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4 text-slate-400" />
                              </Button>
                              {product.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleProductStatusChange(product.id, 'active')}
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleProductStatusChange(product.id, 'rejected')}
                                  >
                                    <XCircle className="w-4 h-4 text-red-400" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteDialog({ open: true, type: 'product', id: product.id, name: product.name })}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Categories Section */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">إدارة الأقسام ({categories.length} قسم)</h2>
                <Button onClick={handleAddCategory} className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة قسم
                </Button>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="bg-slate-800/50 border-slate-700 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <FolderTree className="w-5 h-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{category.name}</h3>
                          <p className="text-slate-400 text-sm">{category.nameEn}</p>