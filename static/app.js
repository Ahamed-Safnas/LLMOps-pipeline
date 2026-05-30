(function () {
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  const STORAGE_KEY = "mdc_session_id";
  const THEME_KEY = "mdc_theme";

  function readStoredValue(key, fallback = "") {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (_err) {
      return fallback;
    }
  }

  function writeStoredValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_err) {
      // Storage can be unavailable in private or embedded browser contexts.
    }
  }

  function removeStoredValue(key) {
    try {
      localStorage.removeItem(key);
    } catch (_err) {
      // Storage can be unavailable in private or embedded browser contexts.
    }
  }

  function createMessageId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // Formatting utilities
  function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return ` ${bytes} B`;
    if (bytes < 1048576) return ` ${(bytes / 1024).toFixed(1)} KB`;
    return ` ${(bytes / 1048576).toFixed(1)} MB`;
  }

  async function readApiError(response, fallback) {
    try {
      const data = await response.json();
      return data.detail || fallback;
    } catch (_err) {
      return fallback;
    }
  }

  // --- SVG Icons ---
  const Icons = {
    Trash: () => h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
      h("polyline", { points: "3 6 5 6 21 6" }),
      h("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
    ),
    File: () => h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
      h("polyline", { points: "14 2 14 8 20 8" })
    ),
    Upload: () => h("svg", { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      h("polyline", { points: "17 8 12 3 7 8" }),
      h("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
    ),
    Send: () => h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
      h("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
      h("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
    ),
    Moon: () => h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })
    ),
    Sun: () => h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
      h("circle", { cx: "12", cy: "12", r: "5" }),
      h("line", { x1: "12", y1: "1", x2: "12", y2: "3" }),
      h("line", { x1: "12", y1: "21", x2: "12", y2: "23" }),
      h("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }),
      h("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }),
      h("line", { x1: "1", y1: "12", x2: "3", y2: "12" }),
      h("line", { x1: "21", y1: "12", x2: "23", y2: "12" }),
      h("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }),
      h("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })
    ),
    Reset: () => h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" })
    ),
    Chat: () => h("svg", { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
    ),
    Help: () => h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
      h("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
    ),
    Risk: () => h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
      h("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
      h("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
    ),
    Sparkles: () => h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M12 3v1M12 20v1M4.22 4.22l.7.7M19.08 19.08l.7.7M1 12h1M22 12h1M4.93 19.08l-.7.7M19.78 4.22l-.7.7" }),
      h("path", { d: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7z" })
    )
  };

  // --- Sub-components ---

  function StatusPill({ ready }) {
    return h(
      "span",
      { className: `status-pill${ready ? " ready" : ""}`, "aria-live": "polite" },
      h("span", { className: "status-dot" }),
      ready ? "Ready" : "Empty Index"
    );
  }

  function QueueFileList({ files, onRemove }) {
    if (files.length === 0) {
      return h("div", { style: { fontSize: "12px", color: "var(--text-muted)", padding: "10px 0" } }, "No files in queue");
    }

    return h(
      "div",
      { className: "file-list" },
      files.map((file, index) =>
        h("div", { key: `${file.name}-${file.size}-${index}`, className: "file-item" },
          h("div", { className: "file-info" },
            h("span", { className: "file-icon" }, h(Icons.File)),
            h("span", { className: "file-name" },
              file.name,
              h("span", { className: "file-size" }, formatFileSize(file.size))
            )
          ),
          h("button", {
            type: "button",
            className: "remove-file-btn",
            onClick: () => onRemove(index),
            "aria-label": `Remove ${file.name} from queue`
          }, h(Icons.Trash))
        )
      )
    );
  }

  function MessageBubble({ message }) {
    const isUser = message.role === "user";
    return h(
      "div",
      { className: `message-row ${isUser ? "user" : "assistant"}` },
      h(
        "div",
        { className: "bubble" },
        h("span", { className: "bubble-sender" }, isUser ? "You" : "MultiDocChat"),
        h("div", { className: "bubble-content" }, message.content)
      )
    );
  }

  function ThinkingBubble() {
    return h(
      "div",
      { className: "message-row assistant" },
      h(
        "div",
        { className: "bubble" },
        h("span", { className: "bubble-sender" }, "Thinking"),
        h(
          "div",
          { className: "thinking-container", "aria-label": "AI is generating a response" },
          h("span", { className: "thinking-dot" }),
          h("span", { className: "thinking-dot" }),
          h("span", { className: "thinking-dot" })
        )
      )
    );
  }

  function Toast({ message, visible }) {
    return h(
      "div",
      {
        className: `toast${visible ? " show" : ""}`,
        role: "status",
        "aria-live": "polite",
      },
      message
    );
  }

  function ConfirmationDialog({ visible, onConfirm, onCancel }) {
    if (!visible) return null;
    return h(
      "div",
      { className: "dialog-overlay" },
      h(
        "div",
        { className: "dialog-box" },
        h("div", { className: "dialog-icon" }, h(Icons.Trash)),
        h("h3", { className: "dialog-title" }, "Clear Session?"),
        h(
          "p",
          { className: "dialog-desc" },
          "This will reset your active document session and conversation history. This action cannot be undone."
        ),
        h(
          "div",
          { className: "dialog-actions" },
          h("button", { className: "dialog-cancel-btn", onClick: onCancel }, "Cancel"),
          h("button", { className: "dialog-confirm-btn", onClick: onConfirm }, "Confirm Reset")
        )
      )
    );
  }

  function SuggestionChips({ onSelect }) {
    const suggestions = [
      { text: "Summarize sources", sub: "Core points & overview", icon: Icons.Sparkles },
      { text: "Analyze key risks", sub: "Spot red flags & exposures", icon: Icons.Risk },
      { text: "Extract action items", sub: "To-do lists & milestones", icon: Icons.Help }
    ];

    return h(
      "div",
      { className: "suggestions-grid" },
      suggestions.map((s, index) =>
        h("button", {
          key: index,
          type: "button",
          className: "suggestion-card",
          onClick: () => onSelect(s.text)
        },
          h("span", { className: "suggestion-icon" }, h(s.icon)),
          h("span", { className: "suggestion-text" }, s.text),
          h("span", { className: "suggestion-sub" }, s.sub)
        )
      )
    );
  }

  // --- Main Application ---

  function App() {
    const [sessionId, setSessionId] = useState(() => readStoredValue(STORAGE_KEY));
    const [fileQueue, setFileQueue] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isIndexing, setIsIndexing] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [draft, setDraft] = useState("");
    const [toast, setToast] = useState({ message: "", visible: false });
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [theme, setTheme] = useState(() => readStoredValue(THEME_KEY, "dark"));

    const messagesRef = useRef(null);
    const textareaRef = useRef(null);
    const toastTimer = useRef(null);

    const ready = Boolean(sessionId);

    // Dynamic theming side-effects
    useEffect(() => {
      if (theme === "light") {
        document.body.classList.add("light");
      } else {
        document.body.classList.remove("light");
      }
      writeStoredValue(THEME_KEY, theme);
    }, [theme]);

    function toggleTheme() {
      setTheme(t => (t === "dark" ? "light" : "dark"));
    }

    function clearSession() {
      setSessionId("");
      setMessages([]);
      setFileQueue([]);
      removeStoredValue(STORAGE_KEY);
      setShowResetDialog(false);
      showToast("Session cleared successfully.");
    }

    // Scroll to bottom when messages or thinking changes
    useEffect(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, [messages, isThinking]);

    // Resizing draft input dynamically
    useEffect(() => {
      if (!textareaRef.current) return;
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }, [draft]);

    useEffect(() => {
      return () => window.clearTimeout(toastTimer.current);
    }, []);

    function showToast(message) {
      window.clearTimeout(toastTimer.current);
      setToast({ message, visible: true });
      toastTimer.current = window.setTimeout(() => {
        setToast((current) => ({ ...current, visible: false }));
      }, 3000);
    }

    function addFilesToQueue(files) {
      const filesArr = Array.from(files || []);
      setFileQueue(current => {
        const unique = [...current];
        filesArr.forEach(nf => {
          if (!unique.some(f => f.name === nf.name && f.size === nf.size)) {
            unique.push(nf);
          }
        });
        return unique;
      });
    }

    function removeFileFromQueue(index) {
      setFileQueue(current => current.filter((_, idx) => idx !== index));
    }

    async function uploadFiles(event) {
      if (event) event.preventDefault();
      if (fileQueue.length === 0) {
        showToast("Please add at least one document to index.");
        return;
      }

      setIsIndexing(true);
      try {
        const formData = new FormData();
        fileQueue.forEach((file) => formData.append("files", file));
        
        const response = await fetch("/upload", { method: "POST", body: formData });
        if (!response.ok) {
          throw new Error(await readApiError(response, "Upload failed"));
        }
        
        const data = await response.json();
        if (!data.session_id) {
          throw new Error("Upload response did not include a session ID.");
        }
        setSessionId(data.session_id);
        writeStoredValue(STORAGE_KEY, data.session_id);
        setMessages([]);
        setFileQueue([]); // Empty the queue after successful upload
        showToast("Documents indexed successfully! Ask anything.");
      } catch (err) {
        console.error(err);
        showToast(err.message || "Failed to index documents. Please try again.");
      } finally {
        setIsIndexing(false);
      }
    }

    async function sendMessage(textToSend) {
      const text = (textToSend || draft).trim();
      if (!sessionId) {
        showToast("Please upload and index documents first.");
        return;
      }
      if (!text || isThinking) return;

      // Update messages immediately
      setMessages((current) => [...current, { id: createMessageId(), role: "user", content: text }]);
      if (!textToSend) setDraft("");
      setIsThinking(true);

      try {
        const response = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message: text }),
        });
        
        if (!response.ok) {
          throw new Error(await readApiError(response, "Communication failed"));
        }
        
        const data = await response.json();
        setMessages((current) => [
          ...current,
          { id: createMessageId(), role: "assistant", content: data.answer },
        ]);
      } catch (err) {
        console.error(err);
        showToast(err.message || "Failed to retrieve response. Please retry.");
      } finally {
        setIsThinking(false);
      }
    }

    function handleDrop(event) {
      event.preventDefault();
      setIsDragging(false);
      addFilesToQueue(event.dataTransfer.files);
    }

    function handleKeyDown(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    }

    return h(
      React.Fragment,
      null,
      h(
        "div",
        { className: "app-container" },
        // --- Sidebar ---
        h(
          "aside",
          { className: "sidebar" },
          h(
            "div",
            { className: "brand-area" },
            h("p", { className: "brand-eyebrow" }, "Multi-Document RAG"),
            h(
              "div",
              { className: "brand-title-row" },
              h("div", { className: "brand-logo" }, "M"),
              h("h1", { className: "brand-title" }, "MultiDocChat")
            )
          ),
          h(
            "div",
            { className: "status-section" },
            h(StatusPill, { ready }),
            h(
              "button",
              {
                className: "icon-btn",
                title: "Toggle Light/Dark Theme",
                onClick: toggleTheme
              },
              theme === "dark" ? h(Icons.Sun) : h(Icons.Moon)
            )
          ),
          h(
            "nav",
            { className: "workflow-nav" },
            h("div", { className: `workflow-step${fileQueue.length > 0 ? " active" : ""}` },
              h("span", { className: "workflow-number" }, "01"),
              h("span", null, "Queue")
            ),
            h("div", { className: `workflow-step${ready ? " active" : ""}` },
              h("span", { className: "workflow-number" }, "02"),
              h("span", null, "Index")
            ),
            h("div", { className: `workflow-step${messages.length > 0 ? " active" : ""}` },
              h("span", { className: "workflow-number" }, "03"),
              h("span", null, "Chat")
            )
          ),
          // Upload workflow panel
          h(
            "div",
            { className: "upload-panel" },
            h("h2", { className: "section-label" }, "1. Core Sources"),
            h(
              "label",
              {
                className: `dropzone${isDragging ? " hover" : ""}`,
                htmlFor: "file-input",
                onDragOver: (event) => {
                  event.preventDefault();
                  setIsDragging(true);
                },
                onDragLeave: () => setIsDragging(false),
                onDrop: handleDrop,
              },
              h("span", { className: "drop-icon-container" }, h(Icons.Upload)),
              h("span", { className: "dropzone-title" }, "Drag files here"),
              h("span", { className: "dropzone-subtitle" }, "Supports PDF, DOCX, TXT"),
              h("input", {
                id: "file-input",
                type: "file",
                name: "files",
                multiple: true,
                hidden: true,
                disabled: isIndexing,
                onChange: (event) => {
                  addFilesToQueue(event.target.files);
                  event.target.value = "";
                },
              })
            ),
            // Queue List
            h(
              "div",
              { className: "queue-container" },
              h("h3", { className: "queue-title" }, `Source Queue (${fileQueue.length})`),
              h(QueueFileList, { files: fileQueue, onRemove: removeFileFromQueue })
            ),
            h(
              "button",
              {
                type: "button",
                className: "primary-btn",
                style: { marginTop: "auto" },
                disabled: isIndexing || fileQueue.length === 0,
                onClick: uploadFiles
              },
              isIndexing ? "Indexing Sources..." : "Index Documents"
            )
          ),
          // Sidebar footer actions
          h(
            "div",
            { className: "sidebar-footer" },
            ready && h("div", { className: "active-session-box" },
              "Session Active: Grounded chat is enabled for current sources."
            ),
            h(
              "div",
              { className: "footer-btn-row" },
              h(
                "button",
                {
                  className: "secondary-btn",
                  type: "button",
                  disabled: !ready,
                  onClick: () => setShowResetDialog(true)
                },
                h(Icons.Reset),
                "New Session"
              ),
              h(
                "a",
                {
                  className: "icon-btn",
                  href: "/health",
                  target: "_blank",
                  title: "View API Health Status",
                  "aria-label": "API Health"
                },
                h(Icons.Sparkles)
              )
            )
          )
        ),
        // --- Main Chat Content Area ---
        h(
          "main",
          { className: "main-content" },
          h(
            "header",
            { className: "chat-header" },
            h("div", null,
              h("h2", { className: "chat-header-title" }, "Workspace Chat"),
              h("p", { className: "chat-header-subtitle" },
                ready ? "AI engine loaded with custom vector indexes." : "Awaiting document vectorization to start grounded chat."
              )
            )
          ),
          // Messages stream
          h(
            "div",
            { className: "messages-container", ref: messagesRef, "aria-live": "polite", "aria-busy": isThinking },
            messages.length === 0
              ? h(
                  "div",
                  { className: "empty-state" },
                  h("div", { className: "empty-logo" }, h(Icons.Chat)),
                  h("h3", { className: "empty-title" }, "Private Document Intelligence"),
                  h("p", { className: "empty-desc" },
                    ready
                      ? "Index successfully loaded. Ask queries about key metrics, summaries, or make document comparisons."
                      : "Upload and index documents in the sidebar. Once complete, you can query your private data in this workspace securely."
                  ),
                  ready && h(SuggestionChips, { onSelect: sendMessage })
                )
              : messages.map((message) => h(MessageBubble, { key: message.id, message })),
            isThinking && h(ThinkingBubble)
          ),
          // Composer input row
          h(
            "div",
            { className: "composer-container" },
            h(
              "div",
              { className: "composer-box" },
              h("textarea", {
                ref: textareaRef,
                className: "composer-textarea",
                rows: 1,
                value: draft,
                placeholder: ready
                  ? "Ask about core elements, risks, summaries, or make key comparisons..."
                  : "Please index documents to enable active grounded chat...",
                disabled: isThinking || !ready,
                onChange: (event) => setDraft(event.target.value),
                onKeyDown: handleKeyDown,
                "aria-label": "Message Input",
              }),
              h(
                "button",
                {
                  className: "send-btn",
                  type: "button",
                  disabled: isThinking || !draft.trim() || !ready,
                  onClick: () => sendMessage(),
                  "aria-label": "Send Message",
                },
                h(Icons.Send)
              )
            ),
            h("p", { className: "composer-hint" }, "MultiDocChat uses local vectors to deliver fully grounded summaries.")
          )
        )
      ),
      h(Toast, { message: toast.message, visible: toast.visible }),
      h(ConfirmationDialog, {
        visible: showResetDialog,
        onConfirm: clearSession,
        onCancel: () => setShowResetDialog(false)
      })
    );
  }

  const root = document.getElementById("root");
  if (root) {
    ReactDOM.createRoot(root).render(h(App));
  }
})();
