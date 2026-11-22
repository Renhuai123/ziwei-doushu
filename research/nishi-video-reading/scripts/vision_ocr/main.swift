// 苹果系统自带文字识别（Vision）命令行：读图片里的中文印刷字。
// 用法：vision_ocr <图片…>  → 每张图输出一行 JSON：{"图": 路径, "行": [{"字": "...", "可信": 0.98, "框": [x, y, w, h]}]}
// 框是 0–1 的相对坐标，原点在左下角（Vision 的约定）。只在本机运行，不联网。
import Foundation
import Vision
import AppKit

func ocr(_ path: String) -> [[String: Any]] {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return [] }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]
    req.usesLanguageCorrection = false
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    do { try handler.perform([req]) } catch { return [] }
    var out: [[String: Any]] = []
    for o in req.results ?? [] {
        guard let top = o.topCandidates(1).first else { continue }
        let b = o.boundingBox
        out.append(["字": top.string, "可信": Double(top.confidence), "框": [b.origin.x, b.origin.y, b.size.width, b.size.height]])
    }
    return out
}

for path in CommandLine.arguments.dropFirst() {
    let rec: [String: Any] = ["图": path, "行": ocr(path)]
    if let d = try? JSONSerialization.data(withJSONObject: rec), let s = String(data: d, encoding: .utf8) { print(s) }
}
