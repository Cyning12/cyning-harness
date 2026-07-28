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

/**
 * P0 · wiki_delta（v2.18+）。
 * 缺字段 → fail（维护者裁定 BLOCK，与 graph_delta 的 WARN 不同）。
 * none|n/a 须 note；path 须相对仓根存在。
 */
export function evaluateWikiDelta(meta = {}, options = {}) {
  const { repoRoot = null } = options;
  const raw = meta.wiki_delta;
  const note = meta.wiki_delta_note;

  if (raw == null || String(raw).trim() === '') {
    return {
      status: 'fail',
      detail: '缺 wiki_delta 字段（须 path|none|n/a · v2.18+ BLOCK）',
      code: 'wiki_delta_missing',
    };
  }

  const delta = String(raw).trim();
  if (/^(none|n\/a)$/i.test(delta)) {
    const noteText = note == null ? '' : String(note).trim();
    if (!noteText) {
      return {
        status: 'fail',
        detail: `wiki_delta=${delta} 须填写 wiki_delta_note`,
        code: 'wiki_delta_none_no_note',
      };
    }
    return {
      status: 'pass',
      detail: `wiki_delta=${delta} · note ok`,
      code: 'wiki_delta_none',
    };
  }

  if (!repoRoot) {
    return {
      status: 'fail',
      detail: `无法定位仓根 · 无法校验 wiki_delta 路径: ${delta}`,
      code: 'wiki_delta_no_root',
    };
  }

  const rel = delta.replace(/^\.\/+/, '').replace(/\\/g, '/');
  if (path.isAbsolute(delta) || rel.startsWith('..')) {
    return {
      status: 'fail',
      detail: `wiki_delta 须为相对仓根路径（当前: ${delta}）`,
      code: 'wiki_delta_bad_path',
    };
  }

  const abs = path.join(repoRoot, rel);
  if (!fs.existsSync(abs)) {
    return {
      status: 'fail',
      detail: `wiki_delta 路径不存在: ${rel}`,
      code: 'wiki_delta_path_missing',
    };
  }

  return {
    status: 'pass',
    detail: `wiki_delta path ok · ${rel}`,
    code: 'wiki_delta_path',
  };
}

/**
 * P1 · experience 节须含 wiki 指针（仅 experience=required 且 wiki_delta=path）。
 */
export function evaluateWikiPromotionPointer(content, meta = {}) {
  const expMode = meta.experience_capture;
  const wikiRaw = meta.wiki_delta;

  if (expMode == null || String(expMode).trim() === '') {
    return {
      status: 'pass',
      detail: '未声明 experience_capture · 跳过 wiki 晋升指针',
      code: 'wiki_promo_skipped_no_exp',
      skipped: true,
    };
  }
  if (!/^required$/i.test(String(expMode).trim())) {
    return {
      status: 'pass',
      detail: 'experience_capture≠required · 跳过 wiki 晋升指针',
      code: 'wiki_promo_skipped_exp_mode',
      skipped: true,
    };
  }
  if (wikiRaw == null || String(wikiRaw).trim() === '') {
    return {
      status: 'pass',
      detail: '无 wiki_delta · 晋升指针由 close_wiki_delta 处理',
      code: 'wiki_promo_skipped_no_wiki',
      skipped: true,
    };
  }

  const delta = String(wikiRaw).trim();
  if (/^(none|n\/a)$/i.test(delta)) {
    return {
      status: 'pass',
      detail: `wiki_delta=${delta} · 不要求经验节 wiki 指针`,
      code: 'wiki_promo_skipped_none',
      skipped: true,
    };
  }

  const section = extractExperienceSection(content);
  if (!section) {
    return {
      status: 'fail',
      detail: 'experience_capture=required 且 wiki_delta=path 时须有经验节并含 wiki 指针',
      code: 'wiki_promo_no_section',
    };
  }

  const body = section.body || '';
  const rel = delta.replace(/^\.\/+/, '').replace(/\\/g, '/');
  const ok =
    /coding_wiki/i.test(body) ||
    /wiki_promoted\s*[:：]/i.test(body) ||
    /(?:^|\n)\s*Wiki\s*[:：]/im.test(body) ||
    (rel && body.includes(rel));

  if (!ok) {
    return {
      status: 'fail',
      detail:
        '经验节缺 wiki 晋升指针（须含 coding_wiki 路径 / wiki_promoted: / Wiki: / 或与 wiki_delta 相同子串）',
      code: 'wiki_promo_missing',
    };
  }

  return {
    status: 'pass',
    detail: '经验节含 wiki 晋升指针',
    code: 'wiki_promo_ok',
  };
}
