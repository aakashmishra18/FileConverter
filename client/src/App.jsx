import { useRef, useState } from "react";
import {
  ShieldCheck, FileImage, Files, Scissors, LockKeyhole, ArrowRight,
  Upload, X, CheckCircle2, Download, LoaderCircle, Sparkles, FileText,
  Github, Menu, Plus, RotateCcw, ChevronDown
} from "lucide-react";
import { imagesToPdf, mergePdfs, splitPdf, downloadPdf, formatBytes } from "./lib/converters";

const TOOLS = [
  { id: "images", title: "Images to PDF", description: "Turn JPG and PNG image's into a PDF.", icon: FileImage, tint: "lavender", formats: "JPG, PNG", action: "Convert to PDF" },
  { id: "merge", title: "Merge PDF", description: "Combine PDFs in the order you choose.", icon: Files, tint: "mint", formats: "PDF", action: "Merge PDFs" },
  { id: "split", title: "Split PDF", description: "Extractt the pages you need into a new PDF.", icon: Scissors, tint: "peach", formats: "PDF", action: "Extract pages" }
];

function App() {
  const [activeTool, setActiveTool] = useState("images");
  const [files, setFiles] = useState([]);
  const [pageRanges, setPageRanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const inputRef = useRef(null);
  const tool = TOOLS.find((item) => item.id === activeTool);

  function selectTool(id) {
    setActiveTool(id);
    setFiles([]);
    setError("");
    setSuccess("");
    setMobileMenu(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function addFiles(incoming) {
    setError("");
    setSuccess("");
    const next = Array.from(incoming || []);
    if (!next.length) return;
    setFiles((current) => {
      const combined = activeTool === "split" ? next.slice(0, 1) : [...current, ...next];
      const unique = [];
      const seen = new Set();
      for (const file of combined) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seen.has(key)) { seen.add(key); unique.push(file); }
      }
      return unique;
    });
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, i) => i !== index));
    setError("");
    setSuccess("");
  }

  function moveFile(index, direction) {
    setFiles((current) => {
      const copy = [...current];
      const target = index + direction;
      if (target < 0 || target >= copy.length) return current;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  async function handleConvert() {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      let bytes;
      let filename;
      if (activeTool === "images") {
        bytes = await imagesToPdf(files);
        filename = "privateconvert-images.pdf";
      } else if (activeTool === "merge") {
        bytes = await mergePdfs(files);
        filename = "privateconvert-merged.pdf";
      } else {
        if (files.length !== 1) throw new Error("Choose one PDF to split.");
        bytes = await splitPdf(files[0], pageRanges);
        filename = "privateconvert-extracted-pages.pdf";
      }
      downloadPdf(bytes, filename);
      setSuccess(`Done! Your PDF was created locally. Download started.`);
    } catch (err) {
      setError(err?.message || "Something went wrong while processing this file.");
    } finally {
      setBusy(false);
    }
  }

  const accept = activeTool === "images" ? "image/jpeg,image/png,.jpg,.jpeg,.png" : "application/pdf,.pdf";
  const canConvert = files.length > 0 && !busy && (activeTool !== "merge" || files.length >= 2);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); selectTool("images"); }}>
          <span className="brand-mark"><FileText size={22} strokeWidth={2.5} /></span>
          <span>private<span className="brand-accent">convert</span><span className="brand-period">.</span></span>
        </a>
        <nav className={`nav-links ${mobileMenu ? "nav-open" : ""}`}>
          <a href="#tools" onClick={() => setMobileMenu(false)}>All tools</a>
          <a href="#privacy" onClick={() => setMobileMenu(false)}>Privacy</a>
          <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How it works</a>
        </nav>
        <div className="header-trust"><ShieldCheck size={16} /> 100% local processing</div>
        <button className="mobile-menu" onClick={() => setMobileMenu((value) => !value)} aria-label="Toggle navigation"><Menu size={22}/></button>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><span className="eyebrow-dot"/> YOUR FILES. YOUR DEVICE. YOUR BUSINESS.</div>
          <h1>Powerful PDF tools.<br/><span>Private by design.</span></h1>
          <p className="hero-copy">Everything you need to work with PDFs, without sending your documents to someone else's server.</p>
          <div className="hero-proof">
            <span><LockKeyhole size={16}/> No uploads</span>
            <span><ShieldCheck size={16}/> No account needed</span>
            <span><Sparkles size={16}/> Free to use</span>
          </div>
        </section>

        <section id="tools" className="workspace">
          <div className="section-heading">
            <div><span className="section-kicker">THE TOOLKIT</span><h2>What would you like to do?</h2></div>
            <span className="tool-count"><span className="live-dot"/> 3 tools available</span>
          </div>
          <div className="tool-grid">
            {TOOLS.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} className={`tool-card ${activeTool === item.id ? "tool-card-active" : ""}`} onClick={() => selectTool(item.id)}>
                <span className={`tool-icon ${item.tint}`}><Icon size={23}/></span>
                <span className="tool-card-title">{item.title}</span>
                <span className="tool-card-description">{item.description}</span>
                <span className="tool-card-bottom"><span>{item.formats}</span><ArrowRight size={17}/></span>
              </button>;
            })}
          </div>

          <div className="converter-panel">
            <div className="panel-header">
              <div className={`tool-icon panel-icon ${tool.tint}`}><tool.icon size={23}/></div>
              <div className="panel-title-wrap"><h3>{tool.title}</h3><p>{tool.description}</p></div>
              <span className="local-pill"><span className="live-dot"/> Runs on your device</span>
            </div>

            <div className="panel-content">
              <div className="upload-label-row"><label>{activeTool === "images" ? "Choose your images" : activeTool === "merge" ? "Add PDFs to merge" : "Choose a PDF to split"}</label><span>Max 50 MB per file</span></div>
              <div
                className={`dropzone ${files.length ? "dropzone-has-files" : ""}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
              >
                <input ref={inputRef} type="file" accept={accept} multiple={activeTool !== "split"} onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
                <div className="upload-symbol"><Upload size={23}/></div>
                <div className="dropzone-title">{files.length ? "Add more files" : "Drop your files here"}</div>
                <p>or <span>browse from your device</span></p>
                <div className="format-chips">{(activeTool === "images" ? ["JPG", "PNG"] : ["PDF"]).map((format) => <span key={format}>{format}</span>)}</div>
              </div>

              {files.length > 0 && <div className="file-list">
                <div className="file-list-heading"><span>Selected files <b>{files.length}</b></span>{activeTool === "merge" && <span className="order-hint">Use arrows to change order</span>}</div>
                {files.map((file, index) => <div className="file-row" key={`${file.name}-${file.size}-${file.lastModified}`}>
                  <div className="file-type-icon"><FileText size={19}/></div>
                  <div className="file-info"><strong title={file.name}>{file.name}</strong><span>{formatBytes(file.size)}</span></div>
                  {activeTool === "merge" && <div className="file-order">
                    <button disabled={index === 0} onClick={() => moveFile(index, -1)} aria-label="Move file up" title="Move up">↑</button>
                    <button disabled={index === files.length - 1} onClick={() => moveFile(index, 1)} aria-label="Move file down" title="Move down">↓</button>
                  </div>}
                  <button className="remove-file" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}><X size={17}/></button>
                </div>)}
                <button className="add-more" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}><Plus size={16}/> Add more files</button>
              </div>}

              {activeTool === "split" && files.length > 0 && <div className="range-control">
                <label htmlFor="page-ranges">Pages to extract</label>
                <input id="page-ranges" value={pageRanges} onChange={(event) => setPageRanges(event.target.value)} placeholder="e.g. 1-3, 5, 8-10"/>
                <small>Use commas and ranges, such as <code>1-3, 5</code>. Page numbers start at 1.</small>
              </div>}

              {error && <div className="alert alert-error" role="alert"><X size={18}/><span>{error}</span></div>}
              {success && <div className="alert alert-success" role="status"><CheckCircle2 size={18}/><span>{success}</span></div>}

              <button className="convert-button" disabled={!canConvert} onClick={handleConvert}>
                {busy ? <><LoaderCircle className="spin" size={19}/> Working locally…</> : <>{tool.action}<ArrowRight size={19}/></>}
              </button>
              <div className="panel-footnote"><LockKeyhole size={14}/> Your files never leave this browser for these tools.</div>
            </div>
          </div>
        </section>

        <section id="privacy" className="privacy-section">
          <div className="privacy-visual"><div className="privacy-orbit orbit-one"/><div className="privacy-orbit orbit-two"/><div className="privacy-shield"><ShieldCheck size={48}/></div><span className="float-tag tag-one"><LockKeyhole size={14}/> On-device</span><span className="float-tag tag-two"><CheckCircle2 size={14}/> No upload</span></div>
          <div className="privacy-copy"><span className="section-kicker">PRIVACY ISN'T AN EXTRA</span><h2>Your files are personal.<br/><span>Your tools should be too.</span></h2><p>PrivateConvert processes your selected images and PDFs directly in your browser. The conversion engine works on your device, so your documents aren't sent to our server for these tools.</p><div className="privacy-points"><div><CheckCircle2 size={18}/><span><b>Local processing</b><small>Files are read by your browser and converted in memory.</small></span></div><div><CheckCircle2 size={18}/><span><b>No account required</b><small>Start working without registering or handing over an email.</small></span></div><div><CheckCircle2 size={18}/><span><b>You control the output</b><small>Download your result directly to your device.</small></span></div></div></div>
        </section>

        <section id="how-it-works" className="steps-section">
          <div className="center-heading"><span className="section-kicker">SIMPLE BY DESIGN</span><h2>Three steps. That's it.</h2><p>No confusing setup. No waiting for uploads.</p></div>
          <div className="steps-grid">
            <div className="step-card"><span className="step-number">01</span><div className="step-icon"><Upload size={22}/></div><h3>Select your files</h3><p>Choose files from your computer or drag them into the tool.</p></div>
            <div className="step-card"><span className="step-number">02</span><div className="step-icon"><Sparkles size={22}/></div><h3>Let the tool work</h3><p>Your browser processes the files locally, without a file upload.</p></div>
            <div className="step-card"><span className="step-number">03</span><div className="step-icon"><Download size={22}/></div><h3>Download your result</h3><p>Your converted PDF is ready to save on your own device.</p></div>
          </div>
        </section>

        <section className="bottom-cta"><div><span className="section-kicker">A LITTLE MORE PEACE OF MIND</span><h2>Work with files. Not worries.</h2><p>Free PDF tools that respect your privacy from the first click.</p></div><button onClick={() => { selectTool("images"); document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" }); }}>Try a tool <ArrowRight size={17}/></button></section>
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><FileText size={19}/></span><span>private<span className="brand-accent">convert</span><span className="brand-period">.</span></span></a><span>Useful tools. Fewer uploads. More privacy.</span><span className="footer-status"><span className="live-dot"/> Browser processing active</span></footer>
    </div>
  );
}

export default App;
