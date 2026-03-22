use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion};
use pdf_editor_temp_lib::pdf_ops::{
    Annotation, AnnotationType, ImageAnnotation, ImageFormat, Position,
    apply_annotations_to_file,
};
use std::{path::PathBuf, time::Duration};
use tempfile::NamedTempFile;

fn bench_pdf_export(c: &mut Criterion) {
    let png_data = std::fs::read(
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("examples/input/fox.png"),
    )
    .expect("fox.png not found in src-tauri/examples/input/");

    let hercules_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("examples/input/hercules.pdf")
        .to_str()
        .unwrap()
        .to_string();

    // fox.png is 5460×3072 px. Scenarios: (label, display_width_pts, display_height_pts)
    let scenarios: &[(&str, f32, f32)] = &[
        ("full_5460x3072", 2730.0, 1536.0),   // baseline: no resize triggered
        ("half_2730x1536", 1365.0, 768.0),
        ("quarter_1365x768", 682.5, 384.0),
        ("tenth_546x307", 273.0, 153.5),
    ];

    let mut group = c.benchmark_group("pdf_export_image_resize");
    group.sample_size(10);
    group.measurement_time(Duration::from_secs(60));

    for (label, display_w, display_h) in scenarios {
        group.bench_with_input(
            BenchmarkId::new("apply_annotations", label),
            &(*display_w, *display_h),
            |b, &(width, height)| {
                b.iter(|| {
                    let out = NamedTempFile::new().expect("failed to create temp file");
                    let out_path = out.path().to_str().unwrap().to_string();

                    let annotations = vec![Annotation {
                        page: 0,
                        position: Position { x: 50.0, y: 600.0 },
                        content: AnnotationType::Image(ImageAnnotation {
                            image_data: png_data.clone(),
                            format: ImageFormat::Png,
                            width,
                            height,
                        }),
                    }];

                    apply_annotations_to_file(&hercules_path, &out_path, &annotations)
                        .expect("export failed");
                });
            },
        );
    }

    group.finish();
}

criterion_group!(benches, bench_pdf_export);
criterion_main!(benches);
