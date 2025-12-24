User can change his settings in the settings menu under the application menu or press the shortcut `Ctrl+,` in windows and `Cmd+,` in mac.

The settings page is opened in a modal window. It is a two-column layout, the left column contains the settings categories and the right column 
contains the setting items  for the selected category. 

The user can select a category by clicking on the category name in the left column.

When the settings page is opened, the stored settings are loaded and the first category is selected by default.

User can click on the save button to save the settings, or click on the cancel button to close the settings page without saving the changes.

Settings are stored in the local file via the tauri store plugin, the document of plugin is [here](https://v2.tauri.app/plugin/store/).

The settings can be accessed in the application by using the `useSettings` hook, and the settings in the hook should be 
updated when the settings page is closed.

The settings category currently supported are:
    - General
    - Appearance
    - Shortcuts
    - Editor

In the future, more settings categories will be added.

In the Editor category, the user can change:
1. default background color of the Excalidraw canvas

More settings will be added in the future.

For the UI components of the settings page, use the Ant Design library, 
the document of library is [here](https://ant-design.antgroup.com/docs/react/introduce),
the document of the components of the library is [here](https://ant-design.antgroup.com/components/overview/).
