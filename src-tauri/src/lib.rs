// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use commands::open_commands::{create_window_with_data, read_drawing_file};
use commands::save_commands::{
    mark_unsaved, save_drawing, AppSaveState, AppState, WindowStateRust,
};
use commands::settings_commands::{load_settings, open_settings_window, reset_settings, save_settings};
use commands::state_commands::{
    confirm_close_with_unsaved, get_window_state, mark_window_edited, mark_window_saved,
    reset_window_created, update_window_state,
};
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::{Emitter, Manager};

#[cfg(desktop)]
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

mod commands;

// Re-export save types for use in the module
pub use commands::save_commands::SaveResult;

/// Simple greet command (example)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Create the application menu with default menus (File, Edit, View, Window, Help)
/// and add Save item to the File menu.
fn create_app_menu(app: &tauri::App) -> Result<(), tauri::Error> {
    // Create Save menu item with accelerator (Cmd+S on Mac, Ctrl+S on Windows/Linux)
    let save_item = MenuItemBuilder::with_id("save", "Save")
        .accelerator("CmdOrControl+S")
        .build(app)?;

    let settings_item = MenuItemBuilder::with_id("settings", "Settings...")
            .accelerator("CmdOrControl+,")
            .build(app)?;

    // Create predefined menu items
    let close_item = PredefinedMenuItem::close_window(app, None)?;
    let quit_item = PredefinedMenuItem::quit(app, None)?;
    let undo_item = PredefinedMenuItem::undo(app, None)?;
    let redo_item = PredefinedMenuItem::redo(app, None)?;
    let cut_item = PredefinedMenuItem::cut(app, None)?;
    let copy_item = PredefinedMenuItem::copy(app, None)?;
    let paste_item = PredefinedMenuItem::paste(app, None)?;
    let select_all_item = PredefinedMenuItem::select_all(app, None)?;
    let minimize_item = PredefinedMenuItem::minimize(app, None)?;
    let about_item = PredefinedMenuItem::about(app, None, None)?;
    let fullscreen_item = PredefinedMenuItem::fullscreen(app, None)?;
    let services_item = PredefinedMenuItem::services(app, None)?;

    // Create App submenu with predefined items
    let app_menu = SubmenuBuilder::new(app, "App")
        .item(&about_item)
        .separator()
        .item(&services_item)
        .separator()
        .item(&settings_item)
        .separator()
        .item(&quit_item) // Predefined: Quit
        .build()?;

    // Create Open menu item with accelerator
    let open_item = MenuItemBuilder::with_id("open", "Open...")
        .accelerator("CmdOrControl+O")
        .build(app)?;

    let new_item = MenuItemBuilder::with_id("new", "New")
        .accelerator("CmdOrControl+N")
        .build(app)?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_item)
        .item(&open_item)
        .separator()
        .item(&save_item)
        .text("saveAs", "Save As...")
        .separator()
        .text("close", "Close Window")
        .text("close_all", "Close All Windows")
        .separator()
        .text("print", "Print...")
        .build()?;
    // Create File submenu with Save and predefined items

    // Create Edit submenu with predefined menu items
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&undo_item) // Predefined: Undo
        .item(&redo_item) // Predefined: Redo
        .separator()
        .item(&cut_item) // Predefined: Cut
        .item(&copy_item) // Predefined: Copy
        .item(&paste_item) // Predefined: Paste
        .separator()
        .item(&select_all_item) // Predefined: Select All
        .build()?;

    // Create View submenu
    let view_menu = SubmenuBuilder::new(app, "View")
        .text("zoomIn", "Zoom In")
        .text("zoomOut", "Zoom Out")
        .separator()
        .text("resetZoom", "Reset Zoom")
        .build()?;

    // Create Window submenu with predefined items
    let window_menu = SubmenuBuilder::new(app, "Window")
        .item(&fullscreen_item)
        .item(&minimize_item) // Predefined: Minimize
        .text("zoom", "Zoom") // Custom: Zoom
        .separator()
        .text("bringAllToFront", "Bring All to Front")
        .build()?;

    // Create Help submenu with predefined about
    let help_menu = SubmenuBuilder::new(app, "Help").build()?;

    // Create main menu with all standard menus
    let menu = MenuBuilder::new(app)
        .items(&[
            &app_menu,
            &file_menu,
            &edit_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ])
        .build()?;

    app.set_menu(menu)?;

    // Handle menu events
    let app_handle = app.handle().clone();
    app.on_menu_event(move |_app_handle, event| {
        match event.id().0.as_str() {
            "save" => {
                // Emit event for frontend to handle save
                let _ = app_handle.emit("menu-save-triggered", ());
            }
            "open" => {
                // Emit event for frontend to handle open
                let _ = app_handle.emit("menu-open-triggered", ());
            }
            "settings" => {
                // Emit event for frontend to open settings window
                let _ = app_handle.emit("menu-settings-triggered", ());
            }
            "new" => {
                // Emit event for frontend to create new file
                let _ = app_handle.emit("menu-new-triggered", ());
            }
            _ => {
                // Other menu events are handled by predefined items (quit, about, etc.)
                println!("Menu event: {:?}", event.id());
            }
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_drawing,
            mark_unsaved,
            read_drawing_file,
            create_window_with_data,
            get_window_state,
            update_window_state,
            mark_window_saved,
            mark_window_edited,
            confirm_close_with_unsaved,
            reset_window_created,
            load_settings,
            save_settings,
            reset_settings,
            open_settings_window
        ])
        .setup(|app| {
            // Initialize save state
            app.manage(AppSaveState(Default::default()));

            // Initialize window states for state machine
            app.manage(AppState {
                save: std::sync::Mutex::new(commands::save_commands::SaveStateRust::default()),
                window_states: std::sync::Mutex::new(std::collections::HashMap::new()),
            });

            // Open devtools for main window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.open_devtools();
            }

            // Create application menu with Save item
            create_app_menu(app)?;

            // Register global shortcuts for save (Cmd/Ctrl+S), open (Cmd/Ctrl+O), and settings (Cmd/Ctrl+,)
            #[cfg(desktop)]
            {
                let app_handle = app.handle().clone();

                // Platform-dependent shortcuts
                #[cfg(target_os = "macos")]
                let save_shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyS);

                #[cfg(target_os = "macos")]
                let open_shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyO);

                #[cfg(target_os = "macos")]
                let settings_shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::Comma);

                #[cfg(target_os = "macos")]
                let new_shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyN);

                #[cfg(not(target_os = "macos"))]
                let save_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyS);

                #[cfg(not(target_os = "macos"))]
                let open_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyO);

                #[cfg(not(target_os = "macos"))]
                let settings_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Comma);

                #[cfg(not(target_os = "macos"))]
                let new_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyN);

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, shortcut, event| {
                            if event.state() == ShortcutState::Pressed {
                                if shortcut == &save_shortcut {
                                    let _ = app_handle.emit("shortcut-save-triggered", ());
                                } else if shortcut == &open_shortcut {
                                    let _ = app_handle.emit("shortcut-open-triggered", ());
                                } else if shortcut == &settings_shortcut {
                                    let _ = app_handle.emit("shortcut-settings-triggered", ());
                                } else if shortcut == &new_shortcut {
                                    let _ = app_handle.emit("shortcut-new-triggered", ());
                                }
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(save_shortcut)?;
                app.global_shortcut().register(open_shortcut)?;
                app.global_shortcut().register(settings_shortcut)?;
                app.global_shortcut().register(new_shortcut)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
