import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Layers, Search, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import categoryService from '../../services/categoryService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategoriesList = async (
    page = pagination.currentPage,
    limit = pagination.limit
  ) => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories({
        search: search || undefined,
        page,
        limit,
      });
      setCategories(res.data?.categories || []);
      if (res.data?.pagination) {
        setPagination({
          currentPage: res.data.pagination.currentPage,
          totalPages: res.data.pagination.totalPages,
          totalRecords: res.data.pagination.totalRecords,
          limit: res.data.pagination.limit,
        });
      }
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesList(1, pagination.limit);
  }, [search]);

  const handlePageChange = (newPage) => {
    fetchCategoriesList(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit) => {
    fetchCategoriesList(1, newLimit);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormValues({ name: '', description: '', status: 'active' });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormValues({
      name: cat.name,
      description: cat.description || '',
      status: cat.status || 'active',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formValues.name.trim()) errors.name = 'Category name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, formValues);
        toast.success('Category updated successfully');
      } else {
        await categoryService.createCategory(formValues);
        toast.success('Category created successfully');
      }
      setModalOpen(false);
      fetchCategoriesList(pagination.currentPage, pagination.limit);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Operation failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await categoryService.deleteCategory(deleteId);
      toast.success('Category deleted successfully');
      setDeleteId(null);
      fetchCategoriesList(pagination.currentPage, pagination.limit);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Cannot delete category'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Organize catalog departments and manage public active/inactive visibility.
            {pagination.totalRecords > 0 && (
              <span className="ml-1 font-medium text-gray-700">
                ({pagination.totalRecords} {pagination.totalRecords === 1 ? 'category' : 'categories'} total)
              </span>
            )}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          icon={Plus}
        >
          Add New Category
        </Button>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg"
            title="Clear search"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Table */}
      {loading && categories.length === 0 ? (
        <div className="min-h-[420px] rounded-3xl border border-gray-100 bg-white shadow-xs flex items-center justify-center">
          <Loader size="lg" text="Loading categories..." />
        </div>
      ) : categories.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 space-y-3">
          <Layers className="w-10 h-10 text-gray-400 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">No categories found</p>
          <Button variant="outline" size="sm" onClick={handleOpenAdd}>
            Create First Category
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {cat.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {cat.slug}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                      {cat.description || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          cat.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {cat.createdAt
                        ? new Date(cat.createdAt).toLocaleDateString('en-IN')
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(cat._id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            limit={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            limitOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            name="name"
            value={formValues.name}
            onChange={handleFormChange}
            placeholder="e.g. Footwear, Consumer Electronics"
            error={formErrors.name}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows="3"
              value={formValues.description}
              onChange={handleFormChange}
              placeholder="Brief summary of category contents..."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formValues.status}
              onChange={handleFormChange}
              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="active">Active (Visible in Store)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? If there are any associated products, deletion will be safely rejected by the backend."
        confirmText="Delete Category"
        loading={deleting}
      />
    </div>
  );
};

export default Categories;
