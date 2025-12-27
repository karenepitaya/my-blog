# Task 02 - User Management & Recycle Bin Structure

- Scope: admin author management and recycle-bin navigation split.
- API alignment: wired admin user list/detail/admin-meta, ban/delete optional inputs, and restore/purge handlers.
- UI updates: new filters, author detail modal with admin remark/tags, ban/delete dialogs with reason/grace days.
- Navigation: recycle bin menu now exposes author/category/article subroutes with query-based view selection.
- Data flow: list refresh after mutations remains via App-level refreshData.

Notes

- Author detail now loads via `/admin/users/:id` before editing admin meta.
- Recycle bin view expects pending-delete items for users/categories/articles.
