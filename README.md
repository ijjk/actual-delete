# actual-delete Atom package

Adds option to context menu in file tree to skip recycle or trash bin and actually deletes the entry.

Works with nuclide package

## Config

| setting | type | default | description |
|---------|------|---------|-------------|
| `confirm` | boolean | `true` | Show a confirm dialog before deleting the files. |

## Keybindings
| Keystroke | Command | Selector |
|-----------|---------|----------|
| `shift-delete` | `actual-delete:delete` | `.tree-view` |
