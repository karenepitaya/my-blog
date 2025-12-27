# Task 03 - Article Management Lifecycle

- Scope: admin/author article workflows, metadata handling, and recycle-bin visibility.
- API alignment: added delete reason/grace, unpublish, restore request, confirm-delete, admin remark update, and detail loading.
- UI updates: ArticleList now supports search/status filters, admin detail modal with remark editing, author actions for publish/unpublish/restore/request, and deletion dialog with reason/grace.
- Editor updates: optional metadata (cover URL preview, optional category, slug display), tag input supports comma/enter, and publish/save copy is localized.
- Recycle bin: article rows display delete reason and restore request message for admin review.

Notes

- Published articles use grace-period delete; drafts delete immediately (server behavior matched in UI).
- Restore requests are disabled once submitted to prevent duplicates.
