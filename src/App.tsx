import React, { useState } from 'react';
import { MixDesignProvider, useMixDesign } from './store/MixDesignContext';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import { AiPanel } from './components/layout/AiPanel';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FlaskConical,
  Gauge,
  Layers3,
  MessageCircle,
  QrCode,
  Ruler,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';

import { ProjectLedgerStep } from './components/steps/ProjectLedgerStep';
import { BasicInfoStep } from './components/steps/BasicInfoStep';
import { MaterialsStep } from './components/steps/MaterialsStep';
import { GradingStep } from './components/steps/GradingStep';
import { MarshallStep } from './components/steps/MarshallStep';
import { ResultsStep } from './components/steps/ResultsStep';
import { VerificationStep } from './components/steps/VerificationStep';
import { ReportStep } from './components/steps/ReportStep';
import { KnowledgeStep } from './components/steps/KnowledgeStep';

function LandingPage({ onStart }: { onStart: () => void }) {
  const heroCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const sparklineRef = React.useRef<HTMLCanvasElement>(null);
  const gradingCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const marshallCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [navScrolled, setNavScrolled] = React.useState(false);
  const authorQrSrc = `${import.meta.env.BASE_URL}author-wechat-qr.jpg`;

  React.useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let tick = 0;
    let width = 0;
    let height = 0;
    const rows = 8;
    const cols = 12;
    let points: Array<{ bx: number; by: number; ox: number; oy: number; speed: number; phase: number; amp: number }> = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = Math.max(window.innerHeight, 760);
      points = [];
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          points.push({
            bx: (c / cols) * width,
            by: (r / rows) * height,
            ox: (Math.random() - 0.5) * 0.8,
            oy: (Math.random() - 0.5) * 0.8,
            speed: 0.3 + Math.random() * 0.7,
            phase: Math.random() * Math.PI * 2,
            amp: 20 + Math.random() * 40,
          });
        }
      }
    };

    const getPoint = (r: number, c: number) => {
      const point = points[r * (cols + 1) + c];
      return {
        x: point.bx + Math.sin(tick * point.speed * 0.008 + point.phase) * point.amp * point.ox * 2,
        y: point.by + Math.cos(tick * point.speed * 0.011 + point.phase + 1) * point.amp * point.oy * 2,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const glows = [
        { x: width * 0.3 + Math.sin(tick * 0.004) * width * 0.12, y: height * 0.4 + Math.cos(tick * 0.003) * height * 0.1, r: width * 0.45, c: 'rgba(140,60,0,0.18)' },
        { x: width * 0.7 + Math.cos(tick * 0.005) * width * 0.1, y: height * 0.5 + Math.sin(tick * 0.004) * height * 0.12, r: width * 0.4, c: 'rgba(80,35,0,0.14)' },
        { x: width * 0.5, y: height * 0.5, r: width * 0.3, c: 'rgba(232,147,26,0.04)' },
      ];
      glows.forEach((g) => {
        const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        grad.addColorStop(0, g.c);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      });

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tl = getPoint(r, c);
          const tr = getPoint(r, c + 1);
          const bl = getPoint(r + 1, c);
          const br = getPoint(r + 1, c + 1);
          const wave = Math.sin(tick * 0.006 + c * 0.4 + r * 0.6);
          const brightness = 0.5 + 0.5 * wave;
          const alpha = (0.03 + brightness * 0.07) * (0.5 + 0.5 * Math.sin(tick * 0.004 + r * 0.8));
          ctx.beginPath();
          ctx.moveTo(tl.x, tl.y);
          ctx.lineTo(tr.x, tr.y);
          ctx.lineTo(br.x, br.y);
          ctx.lineTo(bl.x, bl.y);
          ctx.closePath();
          const grad = ctx.createLinearGradient(tl.x, tl.y, br.x, br.y);
          grad.addColorStop(0, `rgba(180,80,0,${alpha})`);
          grad.addColorStop(0.5, `rgba(232,147,26,${alpha * 1.5})`);
          grad.addColorStop(1, `rgba(100,40,0,${alpha * 0.5})`);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.strokeStyle = `rgba(232,147,26,${0.04 + brightness * 0.06})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      for (let i = 0; i < 12; i++) {
        const sx = width * ((i / 12 + tick * 0.0002 * ((i % 3) + 1)) % 1);
        const sy = height * (0.2 + 0.6 * Math.sin(tick * 0.003 + i * 1.4));
        const sr = 0.8 + Math.sin(tick * 0.02 + i) * 0.6;
        const sa = 0.3 + 0.3 * Math.sin(tick * 0.015 + i * 0.7);
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,80,${sa})`;
        ctx.shadowColor = 'rgba(255,180,40,0.8)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      tick++;
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  React.useEffect(() => {
    const canvas = sparklineRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let tick = 0;
    const base = [7.8, 8.3, 8.8, 9.2, 9.0, 8.6, 8.1];
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);
      const min = Math.min(...base) * 0.92;
      const max = Math.max(...base) * 1.05;
      const xOf = (i: number) => (i / (base.length - 1)) * width;
      const yOf = (v: number) => height - ((v - min) / (max - min)) * height * 0.85 - height * 0.05;
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(232,147,26,0.35)');
      grad.addColorStop(1, 'rgba(232,147,26,0.02)');
      ctx.beginPath();
      base.forEach((v, i) => (i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v))));
      ctx.lineTo(xOf(base.length - 1), height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      base.forEach((v, i) => (i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v))));
      ctx.strokeStyle = '#E8931A';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(232,147,26,0.6)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      const highlight = 3 + Math.sin(tick * 0.03) * 0.8;
      const ix = Math.floor(highlight);
      const frac = highlight - ix;
      if (ix < base.length - 1) {
        const hx = xOf(ix) + frac * (xOf(ix + 1) - xOf(ix));
        const hy = yOf(base[ix]) + frac * (yOf(base[ix + 1]) - yOf(base[ix]));
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD980';
        ctx.shadowColor = 'rgba(255,200,80,0.9)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      tick++;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    const drawGrading = () => {
      const canvas = gradingCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return 0;
      let frame = 0;
      let tick = 0;
      const loop = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const width = rect.width;
        const height = rect.height;
        const pad = { l: 36, r: 16, t: 20, b: 32 };
        const cw = width - pad.l - pad.r;
        const ch = height - pad.t - pad.b;
        ctx.fillStyle = '#16161C';
        ctx.fillRect(0, 0, width, height);
        const lo = [100, 90, 68, 38, 24, 15, 10, 7, 5, 4];
        const hi = [100, 100, 85, 68, 50, 38, 28, 20, 15, 8];
        const design = lo.map((v, i) => Math.max(v, Math.min(hi[i], (v + hi[i]) / 2 + Math.sin(tick * 0.02 + i * 0.5) * ((hi[i] - v) * 0.2))));
        const xOf = (i: number) => pad.l + (i / (lo.length - 1)) * cw;
        const yOf = (v: number) => pad.t + (1 - v / 100) * ch;
        [0, 25, 50, 75, 100].forEach((v) => {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(44,44,58,0.8)';
          ctx.moveTo(pad.l, yOf(v));
          ctx.lineTo(pad.l + cw, yOf(v));
          ctx.stroke();
        });
        ctx.beginPath();
        lo.forEach((v, i) => (i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v))));
        hi.slice().reverse().forEach((v, i) => ctx.lineTo(xOf(lo.length - 1 - i), yOf(v)));
        ctx.closePath();
        ctx.fillStyle = 'rgba(232,147,26,0.06)';
        ctx.fill();
        [hi, lo].forEach((arr) => {
          ctx.beginPath();
          arr.forEach((v, i) => (i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v))));
          ctx.strokeStyle = 'rgba(232,147,26,0.25)';
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
        ctx.beginPath();
        design.forEach((v, i) => (i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v))));
        ctx.strokeStyle = '#E8931A';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(232,147,26,0.6)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
        design.forEach((v, i) => {
          ctx.beginPath();
          ctx.arc(xOf(i), yOf(v), 4, 0, Math.PI * 2);
          ctx.fillStyle = '#E8931A';
          ctx.fill();
          ctx.strokeStyle = '#16161C';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
        tick++;
        frame = requestAnimationFrame(loop);
      };
      loop();
      return frame;
    };
    const frame = drawGrading();
    return () => frame && cancelAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    const canvas = marshallCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    let tick = 0;
    const xs = [3.5, 4.0, 4.5, 5.0, 5.5];
    const datasets = [
      { ys: [7.8, 8.6, 9.2, 8.9, 8.2], color: '#E8931A', label: 'MS (kN)' },
      { ys: [5.8, 4.9, 4.1, 3.4, 2.8], color: '#3DDC84', label: 'VV (%)' },
    ];
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const width = rect.width;
      const height = rect.height;
      ctx.fillStyle = '#16161C';
      ctx.fillRect(0, 0, width, height);
      const pad = { l: 40, r: 16, t: 16, b: 32 };
      const cw = width - pad.l - pad.r;
      const ch = (height - pad.t - pad.b) / 2;
      const oac = 4.3 + Math.sin(tick * 0.018) * 0.4;
      datasets.forEach((ds, di) => {
        const yOff = pad.t + di * (ch + 20);
        const min = Math.min(...ds.ys);
        const max = Math.max(...ds.ys);
        const ylo = min - (max - min) * 0.2;
        const yhi = max + (max - min) * 0.2;
        const xOf = (i: number) => pad.l + ((xs[i] - xs[0]) / (xs[xs.length - 1] - xs[0])) * cw;
        const yOf = (v: number) => yOff + (1 - (v - ylo) / (yhi - ylo)) * ch;
        [0, 0.5, 1].forEach((f) => {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(44,44,58,0.8)';
          ctx.moveTo(pad.l, yOff + f * ch);
          ctx.lineTo(pad.l + cw, yOff + f * ch);
          ctx.stroke();
        });
        ctx.beginPath();
        ds.ys.forEach((v, i) => (i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v))));
        ctx.strokeStyle = ds.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = `${ds.color}80`;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
        const xO = pad.l + ((oac - xs[0]) / (xs[xs.length - 1] - xs[0])) * cw;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(232,147,26,0.6)';
        ctx.setLineDash([3, 4]);
        ctx.moveTo(xO, yOff);
        ctx.lineTo(xO, yOff + ch);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '9px Space Mono';
        ctx.fillText(ds.label, pad.l + 4, yOff + 12);
      });
      tick++;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="acmix-page">
      <nav className={`acmix-nav ${navScrolled ? 'scrolled' : ''}`}>
        <a href="#hero" className="nav-logo">AC<em>·</em>MIX</a>
        <div className="nav-links">
          <a href="#process">设计流程</a>
          <a href="#features">功能特性</a>
          <a href="#specs">技术规范</a>
          <a href="#metrics">数据</a>
        </div>
        <button type="button" onClick={onStart} className="nav-action">开始设计 →</button>
      </nav>

      <section id="hero" className="acmix-hero">
        <canvas ref={heroCanvasRef} id="hero-canvas" />
        <div id="hero-grid" />
        <div className="hero-vignette" />
        <div className="hero-bottom-fade" />

        <div className="hero-content">
          <div className="hero-copy">
            <div className="hero-eyebrow"><span className="hero-eyebrow-dot" />JTG F40-2004 &nbsp;·&nbsp; 马歇尔配合比设计法 &nbsp;·&nbsp; 专业版</div>
            <h1 className="hero-headline">
              <span>沥青混凝土</span>
              <em>配合比设计</em>
              <small>智能工作台</small>
            </h1>
            <p className="hero-desc">把矿料级配、最佳油石比、马歇尔验证和报告输出放进同一个工作台。规范自动对照，计算过程可追溯，适合目标配合比设计与复核交付。</p>
            <div className="hero-proof-row" aria-label="产品能力">
              {['规范内置', '过程留痕', '报告可导出'].map((item) => (
                <span key={item}><CheckCircle2 aria-hidden="true" />{item}</span>
              ))}
            </div>
            <div className="hero-cta-group">
              <button type="button" onClick={onStart} className="btn-cta btn-cta-primary">进入设计工作台 <ArrowRight className="h-4 w-4" /></button>
              <a href="#process" className="btn-cta btn-cta-ghost">查看设计流程</a>
            </div>
          </div>

          <div className="hero-workbench" aria-label="配合比设计工作台预览">
            <div className="hero-workbench-head">
              <div>
                <span>LIVE DESIGN BOARD</span>
                <strong>AC-13 上面层目标配合比</strong>
              </div>
              <em>PASS</em>
            </div>
            <div className="hero-workbench-chart">
              <div className="hero-spec-band" />
              <div className="hero-chart-line hero-chart-line-main" />
              <div className="hero-chart-line hero-chart-line-ghost" />
            </div>
            <div className="hero-workbench-grid">
              {[
                ['OAC', '4.58%', '四分法推导'],
                ['VV', '4.1%', '3-5% 合格'],
                ['MS', '9.2kN', '≥8.0 合格'],
                ['VMA', '15.5%', '≥15 合格'],
              ].map(([label, value, hint]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <em>{hint}</em>
                </div>
              ))}
            </div>
            <div className="hero-workbench-foot">
              <span><Gauge aria-hidden="true" />规范自动校验</span>
              <span><FileCheck2 aria-hidden="true" />报告生成就绪</span>
            </div>
          </div>
        </div>

        <div className="hero-datastrip">
          <div className="hds-item"><div className="hds-label">混合料类型</div><div className="hds-val"><span className="acc">AC-13</span></div><div className="hds-sub">细粒式 · 上面层</div></div>
          <div className="hds-item"><div className="hds-label">最佳油石比 OAC</div><div className="hds-val">4.58<span className="acc"> %</span></div><div className="hds-sub">四分法推导</div></div>
          <div className="hds-item"><div className="hds-label">马歇尔稳定度</div><div className="hds-val">9.2<span className="acc"> kN</span></div><div className="hds-sub">≥ 8.0 kN &nbsp;✓</div></div>
          <div className="hds-item"><div className="hds-label">空隙率 VV</div><div className="hds-val">4.1<span className="acc"> %</span></div><div className="hds-sub">3 ~ 5% &nbsp;✓</div></div>
          <div className="hds-item"><div className="hds-label">规范版本</div><div className="hds-val">JTG <span className="acc">F40</span></div><div className="hds-sub">-2004 全条文内置</div></div>
          <div className="hds-canvas-wrap"><canvas ref={sparklineRef} id="hds-sparkline" /></div>
        </div>
      </section>

      <div className="ticker-wrap"><div className="ticker-inner">{['AC-13 细粒式沥青混凝土','·','AC-16 中粒式沥青混凝土','·','AC-20 中粒式沥青混凝土','·','AC-25 粗粒式沥青混凝土','·','SMA-13 骨架密实式','·','OGFC-13 开级配排水式','·','AC-13 细粒式沥青混凝土','·','AC-16 中粒式沥青混凝土','·','AC-20 中粒式沥青混凝土','·','AC-25 粗粒式沥青混凝土','·','SMA-13 骨架密实式','·','OGFC-13 开级配排水式','·'].map((x, i) => <span key={i} className={`ticker-item ${x === '·' ? 'ticker-sep' : ''}`}>{x}</span>)}</div></div>

      <section id="process" className="acmix-section">
        <div className="container process-container">
          <div className="sec-label">设计流程</div>
          <div className="process-head">
            <div>
              <h2 className="sec-title">五步完成<br />专业配合比设计</h2>
              <p className="sec-sub">从原材料录入到验证报告，每一步都有规范约束，每一个数字都有出处。</p>
            </div>
            <div className="process-summary" aria-label="流程能力摘要">
              <div><strong>5</strong><span>设计节点</span></div>
              <div><strong>JTG</strong><span>规范约束</span></div>
              <div><strong>OAC</strong><span>自动推导</span></div>
            </div>
          </div>

          <div className="process-board">
            <div className="process-flow">
              {[
                {
                  step: '01',
                  Icon: Settings2,
                  title: '基本参数设置',
                  desc: '录入混合料类型、道路等级与密度参数，自动匹配规范指标。',
                },
                {
                  step: '02',
                  Icon: BarChart3,
                  title: '矿料级配设计',
                  desc: '输入筛孔通过率，同步绘制级配曲线并提示越界筛孔。',
                },
                {
                  step: '03',
                  Icon: FlaskConical,
                  title: '马歇尔试验录入',
                  desc: '记录稳定度、流值、VV、VMA、VFA，形成试验组摘要。',
                },
                {
                  step: '04',
                  Icon: Target,
                  title: '最佳油石比计算',
                  desc: '按四分法推导 OAC，输出关键指标曲线和取值依据。',
                },
                {
                  step: '05',
                  Icon: FileCheck2,
                  title: '指标验证与报告',
                  desc: '对照 JTG F40 完成判定，汇总问题并导出设计报告。',
                },
              ].map(({ step, Icon, title, desc }) => (
                <article key={title} className="process-step">
                  <div className="process-step-top">
                    <span className="pc-index">{step}</span>
                    <span className="pc-icon"><Icon aria-hidden="true" /></span>
                  </div>
                  <h3 className="pc-title">{title}</h3>
                  <p className="pc-desc">{desc}</p>
                </article>
              ))}
            </div>

            <aside className="process-ai" aria-label="AI 配合比分析">
              <div className="process-ai-icon"><Sparkles aria-hidden="true" /></div>
              <div>
                <div className="pc-index">AI ASSIST</div>
                <h3 className="pc-title">AI 配合比分析</h3>
                <p className="pc-desc">读取当前设计数据，生成专业评语、优化建议和施工注意事项，作为人工复核前的辅助检查。</p>
              </div>
              <div className="process-ai-checks">
                {[
                  ['数据体检', ClipboardCheck],
                  ['级配风险', Layers3],
                  ['报告评语', FileCheck2],
                ].map(([label, CheckIcon]) => (
                  <span key={label}>
                    <CheckIcon aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="features" className="acmix-section"><div className="container"><div className="sec-label">功能特性</div><h2 className="sec-title">把易错环节<br />变成可检查的流程</h2>
        <div className="features-layout"><div className="features-visual"><span className="feat-tag">GRADING CURVE</span><canvas ref={gradingCanvasRef} /></div><div><h3 className="feature-title">级配曲线实时校验</h3><p className="feature-copy">规范上下限以带形区域展示，设计曲线跟随录入数据更新。筛孔通过率、规范中值和偏差提示集中呈现，减少来回查表与重复录入。</p><FeatureList items={[[Ruler,'折线图 / 柱状图切换','两种视图方式，清晰呈现每个筛孔通过率'],[Zap,'一键填入规范中值','快速生成初始方案，再手动调整优化'],[Gauge,'中值偏差实时计算','量化显示每个筛孔距规范中值的偏差']]} /></div></div>
        <div className="features-layout reverse"><div className="features-visual"><span className="feat-tag">MARSHALL CHART</span><canvas ref={marshallCanvasRef} /></div><div><h3 className="feature-title">马歇尔指标联动推导</h3><p className="feature-copy">稳定度、密度、空隙率、VMA、VFA 统一进入 OAC 计算链路，关键取值、规范范围和验证结论都能回到原始试验数据。</p><FeatureList items={[[Target,'四分法自动推导 OAC','抛物线插值求各指标对应油石比'],[TrendingUp,'指标曲线同步展示','趋势、交点与 OAC 竖线在同一视图中呈现'],[ClipboardCheck,'推导过程透明','显示 a1-a4 的完整依据，便于复核与归档']]} /></div></div>
      </div></section>

      <section id="metrics" className="acmix-section"><div className="container"><div className="sec-label">数字说话</div><h2 className="sec-title">内置规范数据<br />计算结果精准可靠</h2><div className="metrics-grid">{[['6','内置混合料类型\nAC-13 / 16 / 20 / 25 + SMA + OGFC'],['10+','每种类型筛孔数量\n覆盖全粒径范围'],['5','马歇尔验证指标\nMS · FL · VV · VMA · VFA'],['0','手动查规范次数\n全部内置，自动对照']].map(([v,l]) => <div className="metric-card" key={v}><div className="metric-val">{v}</div><div className="metric-label">{l.split('\n').map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</div></div>)}</div></div></section>

      <section id="specs" className="acmix-section"><div className="container"><div className="sec-label">技术规范</div><h2 className="sec-title">AC-13 马歇尔<br />技术指标（高速公路）</h2><p className="sec-sub">依据 JTG F40-2004 表 5.3.3，系统自动匹配对应道路等级的指标要求。</p><div className="spec-table-wrap"><table className="spec-table"><thead><tr><th>指标</th><th>单位</th><th>规范要求（高速 / 一级）</th><th>OAC 处示例值</th><th>状态</th></tr></thead><tbody>{[
        ['马歇尔稳定度 MS','kN','≥ 8.0','9.2','合格'],['流值 FL','0.1mm','20 ~ 40','31','合格'],['空隙率 VV','%','3 ~ 5','4.1','合格'],['矿料间隙率 VMA','%','≥ 15','15.5','合格'],['沥青饱和度 VFA','%','65 ~ 75','73.5','合格'],['击实次数（双面）','次','75（高速）/ 50（二级以下）','75','参考'],['试件标准高度','mm','63.5 ± 1.3','—','参考'],
      ].map(([a,b,c,d,e]) => <tr key={a}><td>{a}</td><td className="mono-cell">{b}</td><td>{c}</td><td className="amber-cell">{d}</td><td><span className={`spec-badge ${e === '合格' ? 'badge-ok' : 'badge-ref'}`}>{e}</span></td></tr>)}</tbody></table></div></div></section>

      <section id="author" className="acmix-section">
        <div className="container">
          <div className="author-panel">
            <div className="author-copy">
              <div className="sec-label">作者信息</div>
              <h2 className="sec-title">AI赛博土木<br />工程 AI 工具作者</h2>
              <p className="sec-sub">专注工程造价、数据资产与 AI 工具化实践，把复杂工程流程做成可复用、可交付、可追溯的数字工具。</p>
              <div className="author-meta">
                <span><UserRound aria-hidden="true" /> 工程数字化工具作者</span>
                <span><MessageCircle aria-hidden="true" /> 扫码交流与合作</span>
              </div>
            </div>

            <div className="author-qr-card" aria-label="作者微信二维码">
              <div className="author-qr-head">
                <span><QrCode aria-hidden="true" /> 微信二维码</span>
                <strong>SCAN</strong>
              </div>
              <div className="author-qr-frame">
                <img src={authorQrSrc} alt="作者微信二维码" loading="lazy" />
              </div>
              <p>微信扫码添加作者，交流配合比设计、工程 AI 工具与项目数字化落地。</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta-section"><div className="container"><p className="cta-big">告别 Excel 手算<br /><em>让配合比设计回归专业</em></p><p className="cta-sub">无需安装，打开即用。规范内置，流程清晰，报告直接打印。</p><button type="button" onClick={onStart} className="btn-cta btn-cta-primary cta-main">立即免费使用 →</button><p className="cta-note">依据 JTG F40-2004 · 单文件 HTML · 无需网络</p></div></section>

      <footer className="acmix-footer"><div className="foot-logo">AC<em>·</em>MIX</div><div className="foot-copy">依据 JTG F40-2004 《公路沥青路面施工技术规范》· AI赛博土木 出品</div><div className="foot-links"><button type="button" onClick={onStart}>使用工具</button><a href="#author">作者信息</a><a href="#specs">规范文档</a><a href="#hero">回到顶部</a></div></footer>
    </div>
  );
}

function FeatureList({ items }: { items: Array<[LucideIcon, string, string]> }) {
  return <ul className="feat-list">{items.map(([Icon, title, copy]) => <li key={title}><div className="feat-icon"><Icon aria-hidden="true" /></div><div className="feat-text"><h4>{title}</h4><p>{copy}</p></div></li>)}</ul>;
}

function MainContent() {
  const { step, setStep, standardProfile } = useMixDesign();
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-app-bg text-text1 overflow-hidden font-sans relative">
      <TopNav onExport={() => setStep(7)} onKnowledge={() => setStep(8)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        <main className="flex-[1] flex flex-col min-w-0 relative z-0">
          <WorkspaceHeader />
          
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10 custom-scrollbar relative print:p-0 print:overflow-visible">
            <div className="w-full">
              <StepPanel active={step === 0}>
                <ProjectLedgerStep />
              </StepPanel>
              <StepPanel active={step === 1}>
                <BasicInfoStep />
              </StepPanel>
              <StepPanel active={step === 2}>
                <MaterialsStep />
              </StepPanel>
              <StepPanel active={step === 3}>
                <GradingStep />
              </StepPanel>
              <StepPanel active={step === 4}>
                <MarshallStep />
              </StepPanel>
              <StepPanel active={step === 5}>
                <ResultsStep />
              </StepPanel>
              <StepPanel active={step === 6}>
                <VerificationStep />
              </StepPanel>
              <div style={{ display: step === 7 ? 'block' : 'none' }} className="print:block">
                <ReportStep onOpenAi={() => setAiOpen(true)} />
              </div>
              <StepPanel active={step === 8}>
                <KnowledgeStep />
              </StepPanel>
            </div>
            
            <footer className="mt-20 pt-6 border-t border-border font-mono text-[11px] text-text3 text-left print:hidden w-full">
              依据 {standardProfile.designSpec} · {standardProfile.testSpec} &nbsp;|&nbsp; 纯前端目标配合比工作台
            </footer>
          </div>
        </main>
      </div>

      {/* Floating AI Button */}
      {!aiOpen && (
        <motion.button
          onClick={() => setAiOpen(true)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple hover:bg-purple/90 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(155,127,255,0.4)] z-[40] transition-colors print:hidden group"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute right-full mr-4 bg-surface border border-border text-text1 text-[11px] font-mono px-2 py-1 rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            智能助手
          </span>
        </motion.button>
      )}

      <AiPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

function StepPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: active ? 'block' : 'none' }} className="print:hidden">
      {children}
    </div>
  );
}

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <MixDesignProvider>
      {started ? <MainContent /> : <LandingPage onStart={() => setStarted(true)} />}
    </MixDesignProvider>
  );
}
