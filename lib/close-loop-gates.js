import fs from 'node:fs';
import path from 'node:path';
import { extractSection } from './task-meta.js';

/**
 * G1 · graph_delta 声明校验（close / verify 共用）。
 * @returns {{ status: 'pass'|'warn'|'fail', detail: string, code?: string }}
 */
export function evaluateGraphDelta(meta = {}, options = {}) {
  const { repoRoot = null } = options;
  const raw = meta.graph_delta;
  const note = meta.graph_delta_note;

  if (raw == null || String(raw).trim() === '') {
    return {
      status: 'warn',
      detail: '缺 graph_delta 字段（v1 WARN · 建议 path|none）',
      code: 'graph_delta_missing',
    };
  }

  const delta = String(raw).trim();
  if (/^none$/i.test(delta)) {
    const noteText = note == null ? '' : String(note).trim();
    if (!noteText) {
      return {
        status: 'fail',
        detail: 'graph_delta=none 须填写 graph_delta_note',
        code: 'graph_delta_none_no_note',
      };
    }
    return {
      status: 'pass',
      detail: 'graph_delta=none · note ok',
      code: 'graph_delta_none',
    };
  }

  if (!repoRoot) {
    return {
      status: 'fail',
      detail: `无法定位仓根 · 无法校验 graph_delta 路径: ${delta}`,
      code: 'graph_delta_no_root',
    };
  }

  const rel = delta.replace(/^\.\/+/, '').replace(/\\/g, '/');
  if (path.isAbsolute(delta) || rel.startsWith('..')) {
    return {
      status: 'fail',
      detail: `graph_delta 须为相对仓根路径（当前: ${delta}）`,
      code: 'graph_delta_bad_path',
    };
  }

  const abs = path.join(repoRoot, rel);
  if (!fs.existsSync(abs)) {
    return {
      status: 'fail',
      detail: `graph_delta 路径不存在: ${rel}`,
      code: 'graph_delta_path_missing',
    };
  }

  return {
    status: 'pass',
    detail: `graph_delta path ok · ${rel}`,
    code: 'graph_delta_path',
  };
}

/**
 * 抽取 ### KPI 节正文（含标题行）。
 */
export function extractKpiSection(content) {
  if (!content) return null;
  const startRe = /^###\s*KPI\b.*$/im;
  const m = content.match(startRe);
  if (!m) return null;
  const start = m.index;
  const rest = content.slice(start + m[0].length);
  const next = rest.search(/^#{1,3}\s/m);
  const body = next === -1 ? rest : rest.slice(0, next);
  return `${m[0]}\n${body}`;
}

/**
 * G3 P0 · KPI 最小可解析分数（仅 kpi_aggregator=CLOSE，缺省视为 CLOSE）。
 */
export function evaluateKpiCloseScore(content, meta = {}) {
  const aggRaw = meta.kpi_aggregator;
  const agg =
    aggRaw == null || String(aggRaw).trim() === ''
      ? 'CLOSE'
      : String(aggRaw).trim();

  if (!/^CLOSE$/i.test(agg)) {
    return {
      status: 'pass',
      detail: `kpi_aggregator=${agg} · 跳过 CLOSE 打分闸`,
      code: 'kpi_skipped',
      skipped: true,
    };
  }

  const section = extractKpiSection(content);
  if (!section) {
    return {
      status: 'fail',
      detail: '缺 ### KPI 节（kpi_aggregator=CLOSE 关账须打分）',
      code: 'kpi_section_missing',
    };
  }

  if (hasParsableKpiScore(section)) {
    return {
      status: 'pass',
      detail: 'KPI 节含可解析分数',
      code: 'kpi_score_ok',
    };
  }

  return {
    status: 'fail',
    detail:
      'KPI 节无可解析分数（须 Task_KPI% 数字 / D1–D5 表 / 四维质量·过程·可观测·回馈 1–5）',
    code: 'kpi_score_missing',
  };
}

export function hasParsableKpiScore(section) {
  if (!section) return false;

  if (/Task_KPI%\s*[:：|=｜]?\s*\d+(\.\d+)?/i.test(section)) return true;
  if (/Task_KPI%[^\n]*\d+/i.test(section)) return true;

  const hasAllD = ['D1', 'D2', 'D3', 'D4', 'D5'].every((d) =>
    new RegExp(`\\b${d}\\b`, 'i').test(section),
  );
  if (hasAllD && /(?:\b[1-5]\b|\b(?:pass|fail|[ABC]|档)\b)/i.test(section)) {
    return true;
  }

  const dims = ['质量', '过程', '可观测', '回馈'];
  if (dims.every((d) => section.includes(d))) {
    const tableHits = dims.filter((d) =>
      new RegExp(`\\|\\s*${d}\\s*\\|\\s*[1-5]\\s*\\|`).test(section),
    );
    if (tableHits.length >= 4) return true;
    const inline = dims.filter((d) =>
      new RegExp(`${d}[^\\n|]{0,40}[1-5]`).test(section),
    );
    if (inline.length >= 4) return true;
  }

  return false;
}

/**
 * 抽取经验节（标题匹配 ### 经验|Experience|经验总结|lessons）。
 */
export function extractExperienceSection(content) {
  if (!content) return null;
  // 勿对中文用 \\b（JS \\w 不含汉字，会导致「### 经验总结」匹配失败）
  const startRe = /^###\s*(经验总结|Experience|经验|lessons)(?=\s|$|[（(:：])/im;
  const m = content.match(startRe);
  if (!m) return null;
  const start = m.index;
  const rest = content.slice(start + m[0].length);
  const next = rest.search(/^#{1,3}\s/m);
  const body = next === -1 ? rest : rest.slice(0, next);
  return { title: m[0].trim(), body };
}

/**
 * G4 · experience_capture。
 * missing → skip；required → 非空节；recommended → warn；not_applicable → note。
 */
export function evaluateExperienceCapture(content, meta = {}) {
  const raw = meta.experience_capture;
  if (raw == null || String(raw).trim() === '') {
    return {
      status: 'pass',
      detail: '未声明 experience_capture · 跳过',
      code: 'experience_skipped',
      skipped: true,
    };
  }

  const mode = String(raw).trim().toLowerCase();
  const note = meta.experience_capture_note;

  if (mode === 'not_applicable') {
    const noteText = note == null ? '' : String(note).trim();
    if (!noteText) {
      return {
        status: 'fail',
        detail: 'experience_capture=not_applicable 须填写 experience_capture_note',
        code: 'experience_na_no_note',
      };
    }
    return {
      status: 'pass',
      detail: 'experience_capture=not_applicable · note ok',
      code: 'experience_na',
    };
  }

  const section = extractExperienceSection(content);
  const nonEmpty = section ? isExperienceBodyNonEmpty(section.body) : false;

  if (mode === 'recommended') {
    if (!section || !nonEmpty) {
      return {
        status: 'warn',
        detail: 'experience_capture=recommended 但经验节缺失或过短（WARN）',
        code: 'experience_recommended_gap',
      };
    }
    return {
      status: 'pass',
      detail: '经验节已回填（recommended）',
      code: 'experience_ok',
    };
  }

  if (mode === 'required') {
    if (!section) {
      return {
        status: 'fail',
        detail:
          'experience_capture=required 缺经验节（### 经验|Experience|经验总结|lessons）',
        code: 'experience_missing',
      };
    }
    if (!nonEmpty) {
      return {
        status: 'fail',
        detail: '经验节过短（须 ≥80 字符或 ≥3 条列表项）',
        code: 'experience_too_short',
      };
    }
    return {
      status: 'pass',
      detail: '经验节已回填（required）',
      code: 'experience_ok',
    };
  }

  return {
    status: 'warn',
    detail: `未知 experience_capture=${raw}（按 recommended 处理）`,
    code: 'experience_unknown',
  };
}

export function isExperienceBodyNonEmpty(body) {
  const cleaned = String(body || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^（[^）]*(回填|待填)[^）]*）$/.test(l))
    .join('\n');
  const compact = cleaned.replace(/\s+/g, ' ').trim();
  if (compact.length >= 80) return true;
  const listItems = cleaned
    .split('\n')
    .filter((l) => /^\s*[-*+]\s+\S/.test(l) || /^\s*\d+\.\s+\S/.test(l));
  return listItems.length >= 3;
}

/** 供测试/文档复用 · 与 status.hasKpiSection 对齐的存在性探测 */
export function hasKpiSectionHeading(content) {
  return Boolean(extractKpiSection(content) || extractSection(content, '### KPI', '\n##'));
}
