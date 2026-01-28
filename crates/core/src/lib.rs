use wasm_bindgen::prelude::*;

mod matrix;
mod renderer;
mod scene;
mod eigen;
mod dynamics;

pub use matrix::*;
pub use renderer::*;
pub use scene::*;
pub use eigen::*;
pub use dynamics::*;

#[wasm_bindgen(start)]
pub fn init() {
    // Set panic hook for better error messages
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}

pub(crate) use console_log;
