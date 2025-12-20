// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use commands::save_commands::{save_drawing, mark_unsaved, AppSaveState};
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
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

/// Create the application menu with File menu containing Save item.
fn create_app_menu(app: &tauri::App) -> Result<(), tauri::Error> {
    // Create Save menu item with accelerator (Cmd+S on Mac, Ctrl+S on Windows/Linux)
    let save_item = MenuItemBuilder::with_id("save", "Save")
        .accelerator("CmdOrControl+S")
        .build(app)?;

    // Create File submenu
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&save_item)
        .separator()
        .text("about", "About")
        .separator()
        .text("quit", "Quit")
        .build()?;

    // Create main menu with File and other menus
    let menu = MenuBuilder::new(app)
        .items(&[&file_menu])
        .text("edit", "Edit")
        .text("view", "View")
        .text("window", "Window")
        .text("help", "Help")
        .build()?;

    app.set_menu(menu)?;

    // Handle menu events
    let app_handle = app.handle().clone();
    app.on_menu_event(move |_app_handle, event| {
        if event.id().0 == "save" {
            // Emit event for frontend to handle save
            let _ = app_handle.emit("menu-save-triggered", ());
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_drawing, mark_unsaved])
        .setup(|app| {
            // Initialize save state
            app.manage(AppSaveState(Default::default()));

            // Create application menu with Save item
            create_app_menu(app)?;

            // Register global shortcut for save (CmdOrControl+S)
            #[cfg(desktop)]
            {
                let app_handle = app.handle().clone();
                let save_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyS);

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, shortcut, event| {
                            if shortcut == &save_shortcut && event.state() == ShortcutState::Pressed {
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
