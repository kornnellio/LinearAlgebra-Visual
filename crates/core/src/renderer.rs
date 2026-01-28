use wasm_bindgen::prelude::*;
use web_sys::{WebGl2RenderingContext, WebGlProgram, WebGlShader};

const VERTEX_SHADER: &str = r#"#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;

out vec3 v_color;

void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    v_color = a_color;
    gl_PointSize = 6.0;
}
"#;

const FRAGMENT_SHADER: &str = r#"#version 300 es
precision highp float;

in vec3 v_color;
out vec4 fragColor;

void main() {
    fragColor = vec4(v_color, 1.0);
}
"#;

#[wasm_bindgen]
pub struct Renderer {
    gl: WebGl2RenderingContext,
    program: WebGlProgram,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_id: &str) -> Result<Renderer, JsValue> {
        let window = web_sys::window().ok_or("No window")?;
        let document = window.document().ok_or("No document")?;
        let canvas = document
            .get_element_by_id(canvas_id)
            .ok_or("Canvas not found")?
            .dyn_into::<web_sys::HtmlCanvasElement>()?;

        let gl = canvas
            .get_context("webgl2")?
            .ok_or("WebGL2 not supported")?
            .dyn_into::<WebGl2RenderingContext>()?;

        let program = create_program(&gl)?;

        // Dark theme background
        gl.clear_color(0.08, 0.08, 0.12, 1.0);
        gl.enable(WebGl2RenderingContext::DEPTH_TEST);
        gl.line_width(2.0);

        Ok(Renderer { gl, program })
    }

    pub fn resize(&self, width: u32, height: u32) {
        self.gl.viewport(0, 0, width as i32, height as i32);
    }

    pub fn clear(&self) {
        self.gl.clear(
            WebGl2RenderingContext::COLOR_BUFFER_BIT | WebGl2RenderingContext::DEPTH_BUFFER_BIT,
        );
    }

    pub fn use_program(&self) {
        self.gl.use_program(Some(&self.program));
    }

    pub fn set_projection(&self, matrix: &[f32]) {
        let loc = self.gl.get_uniform_location(&self.program, "u_projection");
        self.gl.uniform_matrix4fv_with_f32_array(loc.as_ref(), false, matrix);
    }

    pub fn set_view(&self, matrix: &[f32]) {
        let loc = self.gl.get_uniform_location(&self.program, "u_view");
        self.gl.uniform_matrix4fv_with_f32_array(loc.as_ref(), false, matrix);
    }

    pub fn set_model(&self, matrix: &[f32]) {
        let loc = self.gl.get_uniform_location(&self.program, "u_model");
        self.gl.uniform_matrix4fv_with_f32_array(loc.as_ref(), false, matrix);
    }

    pub fn draw_lines(&self, positions: &[f32], colors: &[f32]) {
        let vao = self.gl.create_vertex_array();
        self.gl.bind_vertex_array(vao.as_ref());

        // Position buffer
        let pos_buffer = self.gl.create_buffer();
        self.gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, pos_buffer.as_ref());
        unsafe {
            let pos_array = js_sys::Float32Array::view(positions);
            self.gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &pos_array,
                WebGl2RenderingContext::STATIC_DRAW,
            );
        }
        self.gl.vertex_attrib_pointer_with_i32(0, 3, WebGl2RenderingContext::FLOAT, false, 0, 0);
        self.gl.enable_vertex_attrib_array(0);

        // Color buffer
        let col_buffer = self.gl.create_buffer();
        self.gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, col_buffer.as_ref());
        unsafe {
            let col_array = js_sys::Float32Array::view(colors);
            self.gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &col_array,
                WebGl2RenderingContext::STATIC_DRAW,
            );
        }
        self.gl.vertex_attrib_pointer_with_i32(1, 3, WebGl2RenderingContext::FLOAT, false, 0, 0);
        self.gl.enable_vertex_attrib_array(1);

        let vertex_count = (positions.len() / 3) as i32;
        self.gl.draw_arrays(WebGl2RenderingContext::LINES, 0, vertex_count);

        // Cleanup
        self.gl.delete_buffer(pos_buffer.as_ref());
        self.gl.delete_buffer(col_buffer.as_ref());
        self.gl.delete_vertex_array(vao.as_ref());
    }

    pub fn draw_points(&self, positions: &[f32], colors: &[f32]) {
        let vao = self.gl.create_vertex_array();
        self.gl.bind_vertex_array(vao.as_ref());

        let pos_buffer = self.gl.create_buffer();
        self.gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, pos_buffer.as_ref());
        unsafe {
            let pos_array = js_sys::Float32Array::view(positions);
            self.gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &pos_array,
                WebGl2RenderingContext::STATIC_DRAW,
            );
        }
        self.gl.vertex_attrib_pointer_with_i32(0, 3, WebGl2RenderingContext::FLOAT, false, 0, 0);
        self.gl.enable_vertex_attrib_array(0);

        let col_buffer = self.gl.create_buffer();
        self.gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, col_buffer.as_ref());
        unsafe {
            let col_array = js_sys::Float32Array::view(colors);
            self.gl.buffer_data_with_array_buffer_view(
                WebGl2RenderingContext::ARRAY_BUFFER,
                &col_array,
                WebGl2RenderingContext::STATIC_DRAW,
            );
        }
        self.gl.vertex_attrib_pointer_with_i32(1, 3, WebGl2RenderingContext::FLOAT, false, 0, 0);
        self.gl.enable_vertex_attrib_array(1);

        let vertex_count = (positions.len() / 3) as i32;
        self.gl.draw_arrays(WebGl2RenderingContext::POINTS, 0, vertex_count);

        self.gl.delete_buffer(pos_buffer.as_ref());
        self.gl.delete_buffer(col_buffer.as_ref());
        self.gl.delete_vertex_array(vao.as_ref());
    }
}

fn compile_shader(gl: &WebGl2RenderingContext, shader_type: u32, source: &str) -> Result<WebGlShader, String> {
    let shader = gl.create_shader(shader_type).ok_or("Cannot create shader")?;
    gl.shader_source(&shader, source);
    gl.compile_shader(&shader);

    if gl.get_shader_parameter(&shader, WebGl2RenderingContext::COMPILE_STATUS).as_bool().unwrap_or(false) {
        Ok(shader)
    } else {
        let log = gl.get_shader_info_log(&shader).unwrap_or_default();
        gl.delete_shader(Some(&shader));
        Err(log)
    }
}

fn create_program(gl: &WebGl2RenderingContext) -> Result<WebGlProgram, JsValue> {
    let vert = compile_shader(gl, WebGl2RenderingContext::VERTEX_SHADER, VERTEX_SHADER)
        .map_err(|e| JsValue::from_str(&e))?;
    let frag = compile_shader(gl, WebGl2RenderingContext::FRAGMENT_SHADER, FRAGMENT_SHADER)
        .map_err(|e| JsValue::from_str(&e))?;

    let program = gl.create_program().ok_or("Cannot create program")?;
    gl.attach_shader(&program, &vert);
    gl.attach_shader(&program, &frag);
    gl.link_program(&program);

    if gl.get_program_parameter(&program, WebGl2RenderingContext::LINK_STATUS).as_bool().unwrap_or(false) {
        Ok(program)
    } else {
        let log = gl.get_program_info_log(&program).unwrap_or_default();
        Err(JsValue::from_str(&log))
    }
}
