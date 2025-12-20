// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use commands::save_commands::{mark_unsaved, save_drawing, AppSaveState};
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

    // Create File submenu with Save and predefined items
    let app_menu = SubmenuBuilder::new(app, "App")
        .item(&about_item)
        .separator()
        .item(&services_item)
        .separator()
        .item(&quit_item) // Predefined: Quit
        .build()?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .text("new", "New")
        .text("open", "Open...")
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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_drawing, mark_unsaved])
        .setup(|app| {
            // Initialize save state
            app.manage(AppSaveState(Default::default()));

            // Create application menu with Save item
            create_app_menu(app)?;

            // Register global shortcut for save (Cmd+S on Mac, Ctrl+S on Win/Linux)
            #[cfg(desktop)]
            {
                let app_handle = app.handle().clone();

                // Platform-dependent shortcut
                #[cfg(target_os = "macos")]
                let save_shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::KeyS);

                #[cfg(not(target_os = "macos"))]
                let save_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyS);

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, shortcut, event| {
                            if shortcut == &save_shortcut && event.state() == ShortcutState::Pressed
                            {
                                let _ = app_handle.emit("shortcut-save-triggered", ());
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(save_shortcut)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
