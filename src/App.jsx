import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Bookmark, ChevronRight, Compass, Home, ImagePlus, LogOut, Menu, MessageCircle,
  MoreHorizontal, Moon, Plus, Search, Send, Settings, Sparkles, Sun, TrendingUp, Users, Video, X
} from "lucide-react";
import { loginAccount, logoutAccount, registerAccount, restoreSession } from "./api";

const avatar = "https://i.pravatar.cc/96?img=";
const posts = [
  { id: 1, name: "Maya Chen", handle: "@mayachen", time: "12 min", avatar: 47, text: "A quiet morning, a loud idea. Building something that makes room for better conversations. ✦", image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85", likes: 184, comments: 24, tag: "BUILD IN PUBLIC" },
  { id: 2, name: "Kiran Rao", handle: "@kiranr", time: "1 hr", avatar: 12, text: "The best communities are built one thoughtful reply at a time.", likes: 96, comments: 11, tag: "COMMUNITY NOTES" }
];
const people = [
  { name: "Aisha Williams", role: "Product designer", avatar: 32 },
  { name: "Noah Kim", role: "Indie maker", avatar: 13 },
  { name: "Sofia Laurent", role: "Photographer", avatar: 44 }
];

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = mode === "login" ? await loginAccount({ email: form.email, password: form.password }) : await registerAccount(form);
      onAuthenticated(user);
    } catch (submitError) {
      setError(submitError.message);
    } finally { setBusy(false); }
  };
  return (
    <main className="auth-page">
      <section className="auth-brand"><div className="brand-mark">M</div><span>MK<span>Chat</span></span></section>
      <section className="auth-card">
        <p className="eyebrow">A BETTER WAY TO CONNECT</p>
        <h1>{mode === "login" ? "Welcome back." : "Make room for more."}</h1>
        <p className="muted">{mode === "login" ? "Sign in to continue the conversations that matter." : "Create your original social space in under a minute."}</p>
        <form onSubmit={submit}>
          {mode === "register" && <><label>Full name<input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Username<input required pattern="[a-zA-Z0-9_]{3,30}" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="your_handle" /></label></>}
          <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"} <ChevronRight size={16} /></button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "New to MKChat? Create an account" : "Already have an account? Sign in"}</button>
      </section>
      <p className="auth-footer">Original conversations, thoughtfully connected.</p>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [active, setActive] = useState("Home");
  const [dark, setDark] = useState(false);
  const [composer, setComposer] = useState("");
  const [liked, setLiked] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const nav = [{ label: "Home", icon: Home }, { label: "Discover", icon: Compass }, { label: "Messages", icon: MessageCircle, badge: 3 }, { label: "Communities", icon: Users }, { label: "Saved", icon: Bookmark }];
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const publish = () => { if (!composer.trim()) return; setComposer(""); notify("Your post is live."); };
  const name = user?.name || "there";
  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">M</div><span>MK<span>Chat</span></span></div>
        <button className="create-button" onClick={() => document.querySelector(".composer textarea")?.focus()}><Plus size={18} /> Create</button>
        <nav className="nav-list">{nav.map(({ label, icon: Icon, badge }) => <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => setActive(label)}><Icon size={19} /><span>{label}</span>{badge && <b>{badge}</b>}</button>)}</nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setDark(!dark)}>{dark ? <Sun size={19} /> : <Moon size={19} />}<span>{dark ? "Light mode" : "Dark mode"}</span></button>
          <button className="nav-item" onClick={() => notify("Settings are coming next.")}><Settings size={19} /><span>Settings</span></button>
          <button className="nav-item logout-button" onClick={onLogout}><LogOut size={19} /><span>Sign out</span></button>
          <div className="profile-mini"><img src={user?.avatarUrl || `${avatar}49`} /><div><strong>{name}</strong><small>@{user?.username || "member"}</small></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button><div className="mobile-title">{active}</div><div className="search"><Search size={17} /><input placeholder="Search MKChat" /></div><div className="top-actions"><button className="icon-button" onClick={() => notify("You are all caught up.")}><Bell size={19} /><i /></button><button className="icon-button" onClick={() => setActive("Messages")}><MessageCircle size={19} /></button><img className="top-avatar" src={user?.avatarUrl || `${avatar}49`} /></div></header>
        {menuOpen && <div className="mobile-nav">{nav.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActive(label); setMenuOpen(false); }}><Icon size={18} />{label}</button>)}</div>}
        <div className="content"><section className="feed">
          <div className="welcome"><div><p className="eyebrow">SATURDAY, NOVEMBER 01</p><h1>Good morning, {name.split(" ")[0]} <span>✦</span></h1><p className="muted">Make today a little more meaningful.</p></div><button className="round-button" onClick={() => notify("Your daily reflection is ready.")}><Sparkles size={18} /></button></div>
          <div className="stories"><div className="story add-story"><div className="story-ring"><img src={user?.avatarUrl || `${avatar}49`} /><span><Plus size={14} /></span></div><small>Your story</small></div>{["Maya", "Sofia", "Noah", "Aisha"].map((storyName, i) => <div className="story" key={storyName}><div className="story-ring"><img src={`${avatar}${[47, 44, 13, 32][i]}`} /></div><small>{storyName}</small></div>)}<button className="story-next" onClick={() => notify("You have seen the latest stories.")}><ChevronRight size={18} /></button></div>
          <div className="composer"><img src={user?.avatarUrl || `${avatar}49`} /><textarea value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Share something with your people..." rows="1" /><div className="composer-actions"><div><button title="Add image" onClick={() => notify("Media uploads require Cloudinary configuration.")}><ImagePlus size={18} /></button><button title="Add video" onClick={() => notify("Video uploads are coming next.")}><Video size={18} /></button><button title="Add feeling" onClick={() => notify("Choose a feeling soon.")}><Sparkles size={18} /></button></div><button className="publish" onClick={publish}>Publish <Send size={15} /></button></div></div>
          <div className="feed-heading"><h2>For you</h2><button onClick={() => notify("Feed is already showing the latest posts.")}>Latest <ChevronRight size={15} /></button></div>
          {posts.map((post) => <article className="post" key={post.id}><div className="post-head"><img src={`${avatar}${post.avatar}`} /><div><strong>{post.name}</strong><small>{post.handle} · {post.time}</small></div><button className="more" onClick={() => notify("Post actions are coming next.")}><MoreHorizontal size={19} /></button></div><p className="post-text">{post.text}</p>{post.image && <img className="post-image" src={post.image} alt="" /> }<div className="post-tag">{post.tag}</div><div className="post-actions"><button className={liked.includes(post.id) ? "action liked" : "action"} onClick={() => setLiked(liked.includes(post.id) ? liked.filter((id) => id !== post.id) : [...liked, post.id])}><span>♡</span>{post.likes + (liked.includes(post.id) ? 1 : 0)}</button><button className="action" onClick={() => notify("Comments are coming up next.")}><MessageCircle size={17} />{post.comments}</button><button className="action" onClick={() => notify("Share links are coming next.")}><Send size={16} /> Share</button><button className="save" onClick={() => notify("Saved to your collection.")}><Bookmark size={17} /></button></div></article>)}
        </section><aside className="right-rail"><div className="rail-card ai-card"><div className="ai-icon"><Sparkles size={18} /></div><p className="eyebrow">MK AI</p><h3>Your thoughtful corner of the internet.</h3><p className="muted">Discover conversations and people aligned with what matters to you.</p><button onClick={() => notify("Connect an LLM provider to enable MK AI.")}>Explore with AI <ChevronRight size={15} /></button></div><div className="rail-block"><div className="rail-title"><h3>People to know</h3><button onClick={() => setActive("Discover")}>See all</button></div>{people.map((person) => <div className="person" key={person.name}><img src={`${avatar}${person.avatar}`} /><div><strong>{person.name}</strong><small>{person.role}</small></div><button onClick={() => notify(`Follow request sent to ${person.name}.`)}>+</button></div>)}</div><div className="rail-block topics"><div className="rail-title"><h3>Trending topics</h3><TrendingUp size={17} /></div>{["Designing in public", "The future of work", "Slow living"].map((topic, i) => <div className="topic" key={topic}><small>0{i + 1} · TRENDING</small><strong>{topic}</strong><span>{[124, 89, 64][i]} conversations</span></div>)}</div><footer>© 2026 MKChat · Privacy · Guidelines</footer></aside></div>
      </main>
      {toast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="toast"><Sparkles size={16} />{toast}</motion.div>}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => { restoreSession().then(setUser).catch(() => setUser(null)); }, []);
  if (user === undefined) return <div className="loading-screen"><div className="brand-mark">M</div><p>Preparing your space...</p></div>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  return <Dashboard user={user} onLogout={async () => { await logoutAccount(); setUser(null); }} />;
}

export default App;
