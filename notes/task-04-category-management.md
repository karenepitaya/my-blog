# Task 04 - Category/Column Management

- Scope: admin/author category lifecycle with status filters, owner filtering, and detail visibility.
- API alignment: category detail, admin-meta update, admin delete/restore/purge, author delete/confirm-delete.
- UI updates: author create/edit form, admin detail modal with remark editing, delete dialogs with grace days, status and owner badges.
- Recycle bin: category tab lists pending-delete items with restore/purge actions.

Notes

- Admin view is read-only aside from lifecycle controls and admin remarks.
- Mutations trigger refreshData to keep lists in sync.
