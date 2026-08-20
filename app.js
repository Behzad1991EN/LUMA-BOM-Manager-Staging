'use strict';

const E = LumaEngine;
const APP_NAME = 'LUMA BOM Manager';
const APP_VERSION = 'Version 3.30';
const APP_RELEASE_DATE = '19.08.2026';
const APP_AUTHOR = 'Behzad Eydiyoon';
const WORKSPACE_FORMAT_VERSION = '1.0';
const RECOVERY_KEY = 'luma_bom_manager_v3_30_browser_recovery';
const ACTIVE_TAB_KEY = 'luma_bom_manager_v3_30_active_tab';
const LEGACY_RECOVERY_KEY = 'luma_bom_manager_v3_21_browser_recovery';
const LEGACY_ACTIVE_TAB_KEY = 'luma_bom_manager_v3_21_active_tab';

const TABS = [
  ['Inputs','tabInputs'],
  ['Array Table','tabArray'],
  ['Selected Arrays','tabSelected'],
  ['Bearing Layout','tabBearing'],
  ['PV Module Support plate','tabSupport'],
  ['Project BOM','tabBom'],
  ['Part Master','tabPartMaster'],
  ['Tracker Sketch','tabSketch'],
  ['Analysis','tabAnalysis'],
  ['Calculation Logic','tabLogic'],
];

const ANALYSIS_CURRENCIES = Object.freeze([
  ['USD','USD - US Dollar'],
  ['EUR','EUR - Euro'],
  ['TRY','TRY - Turkish Lira'],
  ['CNY','CNY - Chinese Yuan'],
  ['IRR','IRR - Iranian Rial'],
]);

const SELECTED_ARRAY_COLUMNS = [
  'PV Modules per Tracker','Number of Trackers','Tracker Type','Span Type','Bearing Rule Source','Modules / Side','PV Gaps / Side','Tracker Length (mm)','Calculated End Gap','First Piece Name','First Piece Length','Main Beam B Length','Main Beam C Required Length','Main Beam C Stock Suggestion','Bearing Posts / Tracker','Bearing 120 / Tracker','Bearing 110 / Tracker','Bearing 100 / Tracker','Module Support Plates / Tracker','Bearing Status'
];
const BEARING_COLUMNS = [
  'PV Modules per Tracker','Number of Trackers','Bearing Rule Source','Span Type','Pair No.','Side','Gap from Previous (mm)','Distance from Main Post (mm)','Absolute Distance (mm)','Beam Zone','Bearing Type','Status','Total Bearing Qty'
];
const SUPPORT_DETAIL_COLUMNS = [
  'PV Modules per Tracker','Number of Trackers','Side','Rail No.','Rail Type','Signed Distance from Mid Plane (mm)','Distance from Mid Plane (mm)','Beam Zone','Final Plates / Rail / Side','Total Plates','Influence Bearing','Influence Bearing Distance','Reason'
];
const PART_PREVIEW_COLUMNS = ['No.','Part Name','TAG','Description','Part Number','Category','Unit','Calculation Note'];
const PART_EDITABLE_COLUMNS = new Set(['Part Name','TAG','Description','Part Number','Category']);

const CHANGELOG = {
  '1.00': ['Initial Release'],
  '2.00': ['Excel reference dependency removed','Internal Part Master added','Editable Part Master fields added','Save, load, and reset Part Master lists added','Project BOM quantity columns added by selected array type','No. column added to Project BOM and Part Master','Empty Project BOM cells changed to 0','Last exported session loading added','Dynamic Tracker Sketch tab added','Manual Standard Parts section added','Calculation Logic tab improved for troubleshooting'],
  '2.10': ['BOM and related formulas updated','Changelog Button added'],
  '2.20': ['BOM and related formulas updated','Tracker Sketch updated'],
  '3.00': ['CAD Blocks Availability selector added','BOM based on CAD Block / estimation mode added','Max Span Length estimation logic added for 2-Span, 4-Span, 6-Span, and 8-Span trackers','Sidebar Mode text simplified to CAD Block / Estimation','Estimation mode now shows Symmetrical as fixed text instead of a mode dropdown','Main Beam C counting corrected for small trackers in estimation mode'],
  '3.10': [
    'Major project-management, calculation, BOM, export, and user-interface update','Multi-project workspace support added','New Project, Duplicate Project, Rename Project, and Delete Project functions added','Project Code added for easier project identification and exported file naming','Save Workspace, Save As, Open Workspace, and New Workspace functions added','Unsaved-change indication and automatic workspace recovery added','Keyboard shortcuts added for common project and workspace actions','Project Search added to search projects by Project Name or Project Code','Export All/Selected Projects added with one separate Excel workbook per project','High-resolution Tracker Sketch export added at 3600 × 2100 pixels and 300 DPI','CAD Block and Estimation calculation modes improved','2-Span, 4-Span, 6-Span, and 8-Span automatic estimation improved','Bearing-position and bearing-type calculations improved','PV Module Support Plate calculations improved','Odd and asymmetrical tracker calculations improved with separate North and South side handling','Main Beam C calculation, quantity, stock selection, and drawing corrected','Main Beam C calculations for small trackers corrected','Custom bearing-rule locking removed so bearing-distance rules remain directly editable','Confirmation added before deleting a custom bearing-distance rule','Deleted custom bearing rules automatically return to the default bearing rule','PV Module Gap lock kept as an independent control','k001127 quantity updated to 22 × Tracker','Junction Box quantity changed to floor(Tracker / 2)','Junction Box Holder k001511 changed to floor(Tracker / 2)','k001454 changed to 4 × floor(Tracker / 2)','k001509 changed to 4 × Tracker + 4 × floor(Tracker / 2)','Anemometer-related BOM quantities and per-array rounding improved','Safeguard and SCADA-related BOM calculations and rounding improved','Related electrical and fastener BOM calculations improved','Calculation Note column restored in the Part Master tab','Calculation Notes remain visible even when the current part quantity is zero','Project BOM kept clean without Calculation Note columns','Sidebar layout improved and unnecessary descriptive text removed','Outer sidebar scrolling removed and fixed compact sidebar layout added','Active Project KPI display improved','Export controls changed to compact Active Project and All Projects buttons','Changelog button changed to the same compact half-width layout','Project Search box improved with a magnifying-glass indicator','Notebook tabs changed so selection is indicated by color only without changing tab size or position','Overall button spacing, sidebar organization, and application appearance improved'
  ],
  '3.11': ['Added delete button to part master tab','Added optional fastener contingency percentage column to Project BOM'],
  '3.20': ['Added optional Weight, Material and Contingency columns' , 'Added PV module longitudinal holes distance in input tab','Added a dropdown to select SOLTRK version','Modified the SOLTRK and Junction Box rows to allow manual editing.'
  ],
  '3.30': ['Added Analysis tab with steel-structure weight, material filtering, per-material price registration, multi-currency costs, and kg/kW','Redesigned Analysis as a home page with Steel Structure, Electrical, Major Components, Fasteners, Total Project Cost, and Fastener Packaging destinations','Added persistent unit-price registers for Electrical, Major Components, and Fasteners','Added eight installation-section fastener packages with quantity per package and required quantity','Kept inline table editors active when repositioning the caret with the mouse','Updated all file save actions to request a destination location when supported','Changed k001539 to Anemometer Bracket × 3','Temporarily changed k001099 calculation to Hat rail + Z rail','Updated k001509 to include 4 × Junction Box Holder Plate for both SOLTRK versions','Updated k001503 to DIN 976-1 - M6 × 1000 and ceil(previous result / 5)','Updated k001513 to include 4 × SOLTRK 3.0 Holder Plate in SOLTRK 3.0 mode','Added version-specific SOLTRK and Holder items: 2.0 uses k001534/k001505; 3.0 uses k001549/k001568']
};
const CHANGELOG_DATES = {'1.00':'26.05.2026','2.00':'08.06.2026','2.10':'16.06.2026','2.20':'17.06.2026','3.00':'08.07.2026','3.10':'22.07.2026','3.11':'27.07.2026','3.20':'18.08.2026','3.30':'19.08.2026'};

let workspace = null;
let current = null;
let partMaster = [];
let partMasterColumns = [...INTERNAL_PART_MASTER_COLUMNS];
let workspaceStructureDirty = false;
let currentPartMasterListName = 'Default Internal';
let selectedPartMasterRows = new Set();
let selectedBomRows = new Set();
let customRuleSelectedPv = null;
let uiState = {
  customRule:{pv:'14',mode:'Symmetrical',symmetrical_distance:'8320',semi_pair_count:3,asym_post_count:3,semi_pair_gaps:['8320','7350','6500','',''],asym_north_gaps:['8320','7350','6500','',''],asym_south_gaps:['8320','7350','6500','','']},
  projectBomSearch:'',partMasterSearch:'',analysisPage:'home',analysisPriceEditor:{},analysisItemPriceEditor:{},showPv:true,showSupport:true,showRails:true,showBeams:true,
};
let fixedScrollTarget = null;
let fixedScrollSyncing = false;
let manualPartCounter = 2;

function uuid(){
  if(globalThis.crypto?.randomUUID) return crypto.randomUUID().replaceAll('-','');
  return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2);
}
function clone(value){ return structuredClone(value); }
function escapeHtml(value){ return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function safeFilename(value){ return String(value||'LUMA_BOM').trim().replace(/[\\/:*?"<>|]/g,'_') || 'LUMA_BOM'; }
function formatDateTime(date=new Date()){
  const p=n=>String(n).padStart(2,'0');
  return `${p(date.getDate())}.${p(date.getMonth()+1)}.${date.getFullYear()} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}
function storageGet(key){try{return localStorage.getItem(key);}catch{return null;}}
function storageSet(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}
function storageRemove(key){try{localStorage.removeItem(key);}catch{}}
function showToast(message,duration=2200){
  document.querySelector('.toast')?.remove();
  const toast=document.createElement('div');toast.className='toast';toast.textContent=message;document.body.append(toast);setTimeout(()=>toast.remove(),duration);
}
function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function chooseSaveLocation(filename,description,accept){
  if(typeof window.showSaveFilePicker==='function'){
    try{
      const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description,accept}]});
      return {handle,picker:true,cancelled:false};
    }catch(err){
      if(err?.name==='AbortError')return {handle:null,picker:true,cancelled:true};
      console.warn('The location picker is unavailable; using the browser download instead.',err);
    }
  }
  return {handle:null,picker:false,cancelled:false};
}
async function writeBlobToSaveLocation(blob,filename,location){
  if(location?.cancelled)return {saved:false,cancelled:true,picker:!!location.picker};
  if(location?.handle){
    try{const writable=await location.handle.createWritable();await writable.write(blob);await writable.close();return {saved:true,picker:true};}
    catch(err){console.warn('The selected file could not be written; using the browser download instead.',err);}
  }
  downloadBlob(blob,filename);return {saved:true,picker:false};
}
async function saveBlobWithLocation(blob,filename,description,accept){
  const location=await chooseSaveLocation(filename,description,accept);return writeBlobToSaveLocation(blob,filename,location);
}
async function saveBlobToDirectory(blob,filename,directoryHandle){
  const handle=await directoryHandle.getFileHandle(filename,{create:true});const writable=await handle.createWritable();await writable.write(blob);await writable.close();
}
function getActiveProject(){ return workspace?.projects?.[workspace.active_project_id] || null; }
function isAnalysisCurrency(value){return ANALYSIS_CURRENCIES.some(([code])=>code===value);}
function normalizeAnalysisMaterialPrices(raw){
  const normalized={};
  for(const [key,value] of Object.entries(raw&&typeof raw==='object'?raw:{})){
    const record=value&&typeof value==='object'?value:{};
    const material=String(record.material??key).trim();
    const price=Number(record.price_per_kg??record.price);
    if(!material||!Number.isFinite(price)||price<0)continue;
    normalized[material]={material,price_per_kg:price,currency:isAnalysisCurrency(record.currency)?record.currency:'USD'};
  }
  return normalized;
}
function normalizeAnalysisItemPrices(raw){
  const normalized={};
  for(const [key,value] of Object.entries(raw&&typeof raw==='object'?raw:{})){
    const record=value&&typeof value==='object'?value:{};const price=Number(record.price_per_unit??record.price);if(!key||!Number.isFinite(price)||price<0)continue;
    normalized[String(key)]={price_per_unit:price,currency:isAnalysisCurrency(record.currency)?record.currency:'USD'};
  }
  return normalized;
}
function makeProject(name='Sample Project',code='SAMPLE'){
  return {
    project_id:uuid(),project_name:name,project_code:code,
    inputs:clone(E.DEFAULT_INPUTS),tracker_quantities:E.defaultTrackerQuantities(),bearing_rules:{},manual_parts:E.defaultManualParts(),
    contingency_enabled:false,fastener_contingency_percent:0,bom_metadata_enabled:true,soltrk_version:'2.0',bom_overrides:{},equipment_quantity_overrides:{},
    analysis_material_filter:'ALL',analysis_material_prices:{},analysis_item_prices:{},
    selected_logic_pv:'',selected_sketch_pv:'',is_dirty:false,
  };
}
function makeDefaultWorkspace(){
  const project=makeProject('Sample Project','SAMPLE');
  return {format_version:WORKSPACE_FORMAT_VERSION,workspace_name:'Sample',active_project_id:project.project_id,projects:{[project.project_id]:project},shared_part_master:{columns:[...INTERNAL_PART_MASTER_COLUMNS],rows:E.loadInternalPartMaster(),list_name:'Default Internal'}};
}
function serializeWorkspace(){
  const projects={};
  for(const [id,p] of Object.entries(workspace.projects)){
    projects[id]={project_id:p.project_id,project_name:p.project_name,project_code:p.project_code,inputs:clone(p.inputs),tracker_quantities:clone(p.tracker_quantities),bearing_rules:clone(p.bearing_rules),manual_parts:clone(p.manual_parts),contingency_enabled:p.contingency_enabled===true,fastener_contingency_percent:Math.min(100,Math.max(0,E.asNumber(p.fastener_contingency_percent,0))),bom_metadata_enabled:p.bom_metadata_enabled!==false,soltrk_version:E.normalizeSoltrkVersion(p.soltrk_version),bom_overrides:clone(p.bom_overrides||{}),equipment_quantity_overrides:clone(p.equipment_quantity_overrides||{}),analysis_material_filter:p.analysis_material_filter||'ALL',analysis_material_prices:clone(p.analysis_material_prices||{}),analysis_item_prices:clone(p.analysis_item_prices||{}),selected_logic_pv:p.selected_logic_pv||'',selected_sketch_pv:p.selected_sketch_pv||''};
  }
  return {format_version:WORKSPACE_FORMAT_VERSION,workspace_name:workspace.workspace_name,active_project_id:workspace.active_project_id,projects,shared_part_master:{columns:[...partMasterColumns],rows:clone(partMaster),list_name:currentPartMasterListName},saved_at:formatDateTime(),application_version:APP_VERSION};
}
function normalizeProject(raw,id){
  const p=makeProject(String(raw?.project_name||'Untitled Project'),String(raw?.project_code||raw?.inputs?.project_code||''));
  p.project_id=String(raw?.project_id||id||uuid());
  p.inputs={...clone(E.DEFAULT_INPUTS),...(raw?.inputs||{})}; delete p.inputs.project_code;
  p.tracker_quantities={...E.defaultTrackerQuantities(),...(raw?.tracker_quantities||{})};
  p.bearing_rules=clone(raw?.bearing_rules||{});p.manual_parts=clone(raw?.manual_parts||E.defaultManualParts());
  p.contingency_enabled=raw?.contingency_enabled===true;
  p.fastener_contingency_percent=Math.min(100,Math.max(0,E.asNumber(raw?.fastener_contingency_percent,0)));
  p.bom_metadata_enabled=raw?.bom_metadata_enabled!==false;
  p.soltrk_version=E.normalizeSoltrkVersion(raw?.soltrk_version);p.bom_overrides=clone(raw?.bom_overrides||{});p.equipment_quantity_overrides=clone(raw?.equipment_quantity_overrides||{});
  p.analysis_material_filter=String(raw?.analysis_material_filter||'ALL');p.analysis_material_prices=normalizeAnalysisMaterialPrices(raw?.analysis_material_prices);p.analysis_item_prices=normalizeAnalysisItemPrices(raw?.analysis_item_prices);
  const legacyPrice=Number(raw?.analysis_price_per_kg);if(!Object.keys(p.analysis_material_prices).length&&p.analysis_material_filter!=='ALL'&&Number.isFinite(legacyPrice)&&legacyPrice>0)p.analysis_material_prices[p.analysis_material_filter]={material:p.analysis_material_filter,price_per_kg:legacyPrice,currency:isAnalysisCurrency(raw?.analysis_currency)?raw.analysis_currency:'USD'};
  p.selected_logic_pv=String(raw?.selected_logic_pv||'');p.selected_sketch_pv=String(raw?.selected_sketch_pv||'');p.is_dirty=false;
  return p;
}
function loadWorkspacePayload(raw,recovery=false){
  if(!raw || typeof raw!=='object' || !raw.projects || typeof raw.projects!=='object' || !Object.keys(raw.projects).length) throw new Error('The workspace does not contain any projects.');
  const projects={};for(const [id,r] of Object.entries(raw.projects)){const p=normalizeProject(r,id);projects[p.project_id]=p;}
  let active=String(raw.active_project_id||'');if(!projects[active]) active=Object.keys(projects)[0];
  const shared=raw.shared_part_master||{};
  workspace={format_version:String(raw.format_version||WORKSPACE_FORMAT_VERSION),workspace_name:String(raw.workspace_name||'Sample'),active_project_id:active,projects,shared_part_master:{columns:Array.isArray(shared.columns)&&shared.columns.length?[...shared.columns]:[...INTERNAL_PART_MASTER_COLUMNS],rows:Array.isArray(shared.rows)&&shared.rows.length?clone(shared.rows):E.loadInternalPartMaster(),list_name:String(shared.list_name||'Default Internal')}};
  partMasterColumns=[...workspace.shared_part_master.columns];partMaster=clone(workspace.shared_part_master.rows);currentPartMasterListName=workspace.shared_part_master.list_name;workspaceStructureDirty=!!recovery;Object.values(workspace.projects).forEach(p=>p.is_dirty=!!recovery);selectedPartMasterRows.clear();selectedBomRows.clear();
  manualPartCounter=Math.max(2,...Object.keys(projects).flatMap(()=>[]));
  recalculate();renderAll(true);saveRecovery();
}
function markDirty(structure=false){
  const p=getActiveProject();if(p) p.is_dirty=true;if(structure) workspaceStructureDirty=true;saveRecovery();refreshProjectList();
}
function clearDirtyFlags(){Object.values(workspace.projects).forEach(p=>p.is_dirty=false);workspaceStructureDirty=false;refreshProjectList();saveRecovery();}
function saveRecovery(){
  if(!workspace)return;const dirty=workspaceStructureDirty||Object.values(workspace.projects||{}).some(p=>p.is_dirty);if(!dirty){storageRemove(RECOVERY_KEY);return;}storageSet(RECOVERY_KEY,JSON.stringify(serializeWorkspace()));
}
function ensureAutoPvGap(){
  const p=getActiveProject();if(!p) return;
  if(p.inputs.pv_gap_locked){p.inputs.pv_module_gap=String(E.niceNumber(E.calculateAutoPvModuleGap(p)));}
}
function recalculate(){
  const p=getActiveProject();if(!p){current=null;return;}
  ensureAutoPvGap();current=E.calculateProject(p,partMaster,partMasterColumns);
}

function closeModal(){
  document.getElementById('modalBackdrop').hidden=true;
  document.getElementById('modalBody').innerHTML='';
  document.getElementById('modalActions').innerHTML='';
}
function openModal(title,html,buttons=[]){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').innerHTML=html;
  const actions=document.getElementById('modalActions');actions.innerHTML='';
  for(const button of buttons){
    const el=document.createElement('button');el.textContent=button.text;
    if(button.className) el.className=button.className;
    el.addEventListener('click',()=>button.onClick?.(el));actions.appendChild(el);
  }
  document.getElementById('modalBackdrop').hidden=false;
}
function formRowHtml(label,id,value='',type='text'){
  return `<div class="modal-form-row"><label for="${id}">${escapeHtml(label)}</label><input id="${id}" type="${type}" value="${escapeHtml(value)}"></div>`;
}
function projectCodeExists(code,exceptId=''){
  const target=String(code||'').trim().toLowerCase();
  return Object.values(workspace.projects).some(p=>p.project_id!==exceptId && String(p.project_code||'').trim().toLowerCase()===target);
}
function refreshProjectList(){
  const list=document.getElementById('projectList');if(!list||!workspace)return;
  const query=String(document.getElementById('projectSearch')?.value||'').trim().toLowerCase();
  const selected=workspace.active_project_id;list.innerHTML='';
  for(const p of Object.values(workspace.projects)){
    const search=`${p.project_code} ${p.project_name}`.toLowerCase();if(query && !search.includes(query))continue;
    const opt=document.createElement('option');opt.value=p.project_id;
    opt.textContent=`${p.project_code || '(No Code)'} | ${p.project_name}${p.is_dirty?' *':''}`;
    if(p.project_id===selected)opt.selected=true;list.appendChild(opt);
  }
}
function updateWorkspaceName(){
  const label=document.getElementById('workspaceName');if(!label||!workspace)return;const name=String(workspace.workspace_name||'Sample');label.textContent=name;label.title=name;
}
function updateHeaderAndKpis(){
  const p=getActiveProject();if(!p||!current)return;
  document.getElementById('currentProjectHeader').textContent=`Current Project: ${p.project_code || '(No Code)'} — ${p.project_name}`;
  document.getElementById('kpiTrackers').textContent=Number(current.kpis.totalTrackers).toLocaleString();
  document.getElementById('kpiModules').textContent=Number(current.kpis.totalModules).toLocaleString();
  document.getElementById('kpiPower').textContent=`${Number(current.kpis.totalPower).toLocaleString(undefined,{minimumFractionDigits:3,maximumFractionDigits:3})} MWp`;
  document.getElementById('kpiBomItems').textContent=Number(current.kpis.bomItems).toLocaleString();
  document.getElementById('kpiMode').textContent=current.kpis.mode;
}
function newWorkspace(){
  openModal('New Workspace',
    formRowHtml('Workspace Name','newWorkspaceName','Sample')+
    formRowHtml('First Project Name','newWorkspaceProjectName','Sample Project')+
    formRowHtml('Project Code','newWorkspaceProjectCode','PROJECT-001'),[
      {text:'Cancel',onClick:closeModal},
      {text:'Create',onClick:()=>{
        const wsName=document.getElementById('newWorkspaceName').value.trim()||'Sample';
        const name=document.getElementById('newWorkspaceProjectName').value.trim()||'Sample Project';
        const code=document.getElementById('newWorkspaceProjectCode').value.trim()||'PROJECT-001';
        const p=makeProject(name,code);workspace={format_version:WORKSPACE_FORMAT_VERSION,workspace_name:wsName,active_project_id:p.project_id,projects:{[p.project_id]:p},shared_part_master:{columns:[...INTERNAL_PART_MASTER_COLUMNS],rows:E.loadInternalPartMaster(),list_name:'Default Internal'}};
        partMasterColumns=[...INTERNAL_PART_MASTER_COLUMNS];partMaster=E.loadInternalPartMaster();currentPartMasterListName='Default Internal';workspaceStructureDirty=true;selectedPartMasterRows.clear();selectedBomRows.clear();customRuleSelectedPv=null;closeModal();renderAll(true);markDirty(true);
      }}
    ]);
}
function openWorkspace(){document.getElementById('workspaceFileInput').click();}
function renameWorkspace(){
  openModal('Rename Workspace',formRowHtml('Workspace Name','renameWorkspaceName',workspace.workspace_name||'Sample'),[
    {text:'Cancel',onClick:closeModal},
    {text:'Rename',onClick:()=>{const name=document.getElementById('renameWorkspaceName').value.trim();if(!name){showToast('Enter a workspace name.');return;}workspace.workspace_name=name;workspaceStructureDirty=true;updateWorkspaceName();saveRecovery();closeModal();showToast('Workspace renamed.');}}
  ]);
}
async function saveWorkspace(){
  const filename=`${safeFilename(workspace.workspace_name)}.luma`;const payload=serializeWorkspace();const result=await saveBlobWithLocation(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),filename,'LUMA workspace',{'application/json':['.luma']});
  if(!result.saved)return;clearDirtyFlags();showToast(result.picker?'Workspace saved.':'Workspace downloaded.');
}
function nextProjectNumber(){
  let n=1;const codes=new Set(Object.values(workspace.projects).map(p=>String(p.project_code||'').toUpperCase()));while(codes.has(`PROJECT-${String(n).padStart(3,'0')}`))n++;return n;
}
function newProject(){
  const n=nextProjectNumber();openModal('New Project',formRowHtml('Project Name','newProjectName',`Untitled Project ${n}`)+formRowHtml('Project Code','newProjectCode',`PROJECT-${String(n).padStart(3,'0')}`),[
    {text:'Cancel',onClick:closeModal},{text:'Create',onClick:()=>{
      const name=document.getElementById('newProjectName').value.trim()||`Untitled Project ${n}`;const code=document.getElementById('newProjectCode').value.trim();
      if(!code){showToast('Project Code is required.');return;}if(projectCodeExists(code)){showToast('Project Code must be unique.');return;}
      const p=makeProject(name,code);p.is_dirty=true;workspace.projects[p.project_id]=p;workspace.active_project_id=p.project_id;workspaceStructureDirty=true;selectedBomRows.clear();document.getElementById('projectSearch').value='';closeModal();renderAll(true);saveRecovery();
    }}]);
}
function duplicateProject(){
  const source=getActiveProject();if(!source)return;
  let name=`${source.project_name} - Copy`;let base=`${source.project_code || 'PROJECT'}-COPY`;let code=base,n=2;while(projectCodeExists(code)){code=`${base}-${n++}`;}
  const copy=clone(source);copy.project_id=uuid();copy.project_name=name;copy.project_code=code;copy.is_dirty=true;workspace.projects[copy.project_id]=copy;workspace.active_project_id=copy.project_id;workspaceStructureDirty=true;selectedBomRows.clear();document.getElementById('projectSearch').value='';renderAll(true);saveRecovery();
}
function renameProject(){
  const p=getActiveProject();if(!p)return;
  openModal('Rename Project',formRowHtml('Project Name','renameProjectName',p.project_name),[
    {text:'Cancel',onClick:closeModal},{text:'Rename',onClick:()=>{const v=document.getElementById('renameProjectName').value.trim();if(!v)return;p.project_name=v;p.is_dirty=true;workspaceStructureDirty=true;closeModal();renderAll(true);saveRecovery();}}
  ]);
}
function deleteProject(){
  const ids=Object.keys(workspace.projects);if(ids.length<=1){showToast('The workspace must contain at least one project.');return;}
  const p=getActiveProject();if(!p)return;if(!confirm(`Delete project "${p.project_name}"?\n\nThis action cannot be undone after saving.`))return;
  delete workspace.projects[p.project_id];workspace.active_project_id=Object.keys(workspace.projects)[0];workspaceStructureDirty=true;selectedBomRows.clear();document.getElementById('projectSearch').value='';renderAll(true);saveRecovery();
}
function selectProject(projectId){
  if(!workspace.projects[projectId])return;workspace.active_project_id=projectId;selectedPartMasterRows.clear();selectedBomRows.clear();customRuleSelectedPv=null;
  const q=document.getElementById('projectSearch').value.trim().toLowerCase();const p=getActiveProject();if(q&&!`${p.project_code} ${p.project_name}`.toLowerCase().includes(q))document.getElementById('projectSearch').value='';renderAll(true);saveRecovery();
}
function resetCurrentProject(){
  const p=getActiveProject();if(!p)return;
  if(!confirm('Reset all inputs, tracker quantities, bearing rules, and manual parts for the current project?\n\nThis action cannot be undone after saving.'))return;
  p.inputs=clone(E.DEFAULT_INPUTS);p.tracker_quantities=E.defaultTrackerQuantities();p.bearing_rules={};p.manual_parts=E.defaultManualParts();p.contingency_enabled=false;p.fastener_contingency_percent=0;p.bom_metadata_enabled=true;p.soltrk_version='2.0';p.bom_overrides={};p.equipment_quantity_overrides={};p.analysis_material_filter='ALL';p.analysis_material_prices={};p.analysis_item_prices={};p.selected_logic_pv='';p.selected_sketch_pv='';p.is_dirty=true;selectedBomRows.clear();customRuleSelectedPv=null;uiState.analysisPage='home';uiState.customRule={pv:'14',mode:'Symmetrical',symmetrical_distance:'8320',semi_pair_count:3,asym_post_count:3,semi_pair_gaps:['8320','7350','6500','',''],asym_north_gaps:['8320','7350','6500','',''],asym_south_gaps:['8320','7350','6500','','']};renderAll(true);saveRecovery();
}
function renderTabs(){
  const tabs=document.getElementById('tabs');if(tabs.children.length===0){
    for(const [label,id] of TABS){const b=document.createElement('button');b.textContent=label;b.dataset.target=id;b.addEventListener('click',()=>activateTab(id));tabs.appendChild(b);}
  }
  let active=storageGet(ACTIVE_TAB_KEY)||storageGet(LEGACY_ACTIVE_TAB_KEY)||'tabInputs';if(!TABS.some(([,id])=>id===active))active='tabInputs';activateTab(active,false);
}
function activateTab(id,store=true){
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.toggle('active',p.id===id));
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.target===id));
  if(store)storageSet(ACTIVE_TAB_KEY,id);
  if(id==='tabSketch')drawSketch();requestAnimationFrame(()=>requestAnimationFrame(updateFixedHorizontalScroll));
}
function inputRow(label,key,value,extra=''){
  return `<div class="form-row"><label for="input_${key}">${escapeHtml(label)}</label><input id="input_${key}" data-input-key="${key}" value="${escapeHtml(value)}" ${extra}><span></span></div>`;
}
function tripleInputRow(label,keys,values){
  const placeholders=['400','790','1400'];
  return `<div class="form-row"><label for="input_${keys[0]}">${escapeHtml(label)}</label><div class="triple-input-row">${keys.map((key,index)=>`<input id="input_${key}" data-input-key="${key}" data-max-digits="4" inputmode="numeric" maxlength="4" placeholder="${placeholders[index]}" aria-label="${escapeHtml(label)} ${index+1}" value="${escapeHtml(values[index]??'')}">`).join('')}</div><span></span></div>`;
}
function selectRow(label,key,value,options){
  return `<div class="form-row"><label for="input_${key}">${escapeHtml(label)}</label><select id="input_${key}" data-input-key="${key}">${options.map(o=>`<option ${String(o)===String(value)?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select><span></span></div>`;
}
function bindStandardInputs(container){
  container.querySelectorAll('[data-input-key]').forEach(el=>{
    const event=el.tagName==='SELECT'?'change':'input';el.addEventListener(event,()=>{
      const p=getActiveProject();const key=el.dataset.inputKey;if(key.startsWith('__'))return;p.inputs[key]=el.value;
      if(el.dataset.maxDigits){el.value=el.value.replace(/\D/g,'').slice(0,Number(el.dataset.maxDigits));p.inputs[key]=el.value;}
      if(['pv_module_width','pv_module_hole_distance','hat_rail_hole_distance'].includes(key) && p.inputs.pv_gap_locked){p.inputs.pv_module_gap=String(E.niceNumber(E.calculateAutoPvModuleGap(p)));const gap=document.getElementById('input_pv_module_gap');if(gap)gap.value=p.inputs.pv_module_gap;}
      markDirty();refreshOutputsOnly();
    });
  });
}
function renderInputsTab(){
  const p=getActiveProject(),i=p.inputs,root=document.getElementById('tabInputs');
  root.innerHTML=`
    <div class="input-section"><h2 class="section-title">Project Inputs</h2>
      ${inputRow('Project Name','__project_name',p.project_name)}
      ${inputRow('Project Code','__project_code',p.project_code)}
      ${inputRow('PV Module Power (Wp)','pv_power',i.pv_power)}
      ${selectRow('Foundation Type','foundation_type',i.foundation_type,['Ramming','Embedment'])}
      <div class="form-row"><label>CAD Blocks Availability</label><div class="radio-row">
        <label class="radio-label"><input type="radio" name="cadAvailability" value="Yes" ${String(i.cad_blocks_available).toLowerCase()==='yes'?'checked':''}> Yes</label>
        <label class="radio-label"><input type="radio" name="cadAvailability" value="No" ${String(i.cad_blocks_available).toLowerCase()==='no'?'checked':''}> No</label>
      </div><span></span></div>
    </div>
    <div class="input-section"><h2 class="section-title">PV Module Inputs</h2>
      ${inputRow('PV Module Width (mm)','pv_module_width',i.pv_module_width)}
      ${inputRow('PV Module Length (mm)','pv_module_length',i.pv_module_length)}
      ${inputRow('PV Module Transverse Hole Distance (mm)','pv_module_hole_distance',i.pv_module_hole_distance)}
      ${tripleInputRow('PV Module Longitudinal Hole Distance (mm)',['pv_module_longitudinal_hole_distance_1','pv_module_longitudinal_hole_distance_2','pv_module_longitudinal_hole_distance_3'],[i.pv_module_longitudinal_hole_distance_1,i.pv_module_longitudinal_hole_distance_2,i.pv_module_longitudinal_hole_distance_3])}
      ${inputRow('Hat Rail Hole Distance (mm)','hat_rail_hole_distance',i.hat_rail_hole_distance)}
      ${inputRow('Z Rail Design Offset (mm)','z_rail_offset',i.z_rail_offset)}
      <div class="form-row"><label for="input_pv_module_gap">PV Module Gap (mm)</label><div class="lock-row"><input id="input_pv_module_gap" value="${escapeHtml(i.pv_module_gap)}" ${i.pv_gap_locked?'readonly':''}><button id="pvGapLock" class="lock-switch ${i.pv_gap_locked?'':'unlocked'}" title="Locked mode: PV Module Gap = PV Module Transverse Hole Distance + Hat Rail Hole Distance - PV Module Width"><span>${i.pv_gap_locked?'LOCK':'UNLOCK'}</span></button></div><span></span></div>
      ${inputRow('Motor Gap (mm)','motor_gap',i.motor_gap)}
      ${inputRow('Target End Gap (mm)','target_end_gap',i.target_end_gap)}
    </div>
    <div class="input-section"><h2 class="section-title">Main Beam Inputs</h2>
      ${inputRow('Overlap A/B (mm)','overlap_ab',i.overlap_ab)}
      ${inputRow('Overlap B/C (mm)','overlap_bc',i.overlap_bc)}
      ${inputRow('Main Beam A Length - Long Tracker (mm)','main_beam_a_length',i.main_beam_a_length)}
      ${inputRow('Slew Drive Connection Length - Short Tracker (mm)','main_beam_connection_length',i.main_beam_connection_length)}
      ${inputRow('Main Beam B Length (mm)','main_beam_b_length',i.main_beam_b_length)}
      ${inputRow('Main Beam C Short Length (mm)','main_beam_c_short_length',i.main_beam_c_short_length)}
      ${inputRow('Main Beam C Long Length (mm)','main_beam_c_long_length',i.main_beam_c_long_length)}
      ${inputRow('Mid Plane to Beginning of Main Beam A / Connection (mm)','mid_plane_to_beam_a',i.mid_plane_to_beam_a)}
    </div>
    <div class="input-section"><h2 class="section-title compact">Bearing Post Distance by Array Type</h2><p class="subtitle">Enter bearing distances for each array type. Add one row for every PV array type used in the project.</p><div id="bearingConfig"></div></div>
    <div class="input-section"><h2 class="section-title compact">Manual Standard Parts</h2><p class="subtitle">Use these rows for standard parts that cannot be calculated automatically, such as Datalogger and Safeguard.</p><div id="manualParts"></div></div>`;
  bindStandardInputs(root);
  document.getElementById('input___project_name').addEventListener('input',e=>{p.project_name=e.target.value;markDirty();updateHeaderAndKpis();refreshProjectList();saveRecovery();});
  document.getElementById('input___project_code').addEventListener('change',e=>{const v=e.target.value.trim();if(!v||projectCodeExists(v,p.project_id)){showToast('Project Code must be non-empty and unique.');e.target.value=p.project_code;return;}p.project_code=v;markDirty();updateHeaderAndKpis();refreshProjectList();});
  document.querySelectorAll('input[name="cadAvailability"]').forEach(r=>r.addEventListener('change',()=>{p.inputs.cad_blocks_available=r.value;if(r.value==='No')uiState.customRule.mode='Symmetrical';markDirty();renderAll(true);}));
  const gap=document.getElementById('input_pv_module_gap');gap.addEventListener('input',()=>{if(!p.inputs.pv_gap_locked){p.inputs.pv_module_gap=gap.value;markDirty();refreshOutputsOnly();}});
  document.getElementById('pvGapLock').addEventListener('click',()=>{p.inputs.pv_gap_locked=!p.inputs.pv_gap_locked;if(p.inputs.pv_gap_locked)p.inputs.pv_module_gap=String(E.niceNumber(E.calculateAutoPvModuleGap(p)));markDirty();renderInputsTab();refreshOutputsOnly();});
  renderBearingConfig();renderManualParts();
}

function syncCustomRuleFromProject(pv){
  const p=getActiveProject();const rule=p.bearing_rules[String(pv)];
  if(rule){
    const r=E.normalizeBearingRule(rule);uiState.customRule={pv:String(pv),mode:r.mode,symmetrical_distance:String(E.niceNumber(r.symmetrical_distance)),semi_pair_count:Math.max(1,Math.min(5,r.semi_pair_count||1)),asym_post_count:Math.max(1,Math.min(5,r.asym_post_count||1)),semi_pair_gaps:Array.from({length:5},(_,x)=>x<r.semi_pair_gaps.length?String(E.niceNumber(r.semi_pair_gaps[x])):''),asym_north_gaps:Array.from({length:5},(_,x)=>x<r.asym_north_gaps.length?String(E.niceNumber(r.asym_north_gaps[x])):''),asym_south_gaps:Array.from({length:5},(_,x)=>x<r.asym_south_gaps.length?String(E.niceNumber(r.asym_south_gaps[x])):'')};
  }else{
    const d=E.defaultBearingRule(p.inputs);uiState.customRule={pv:String(pv),mode:d.mode,symmetrical_distance:String(E.niceNumber(d.symmetrical_distance)),semi_pair_count:Math.max(1,Math.min(5,d.semi_pair_count||1)),asym_post_count:Math.max(1,Math.min(5,d.asym_post_count||1)),semi_pair_gaps:Array.from({length:5},(_,x)=>x<d.semi_pair_gaps.length?String(E.niceNumber(d.semi_pair_gaps[x])):''),asym_north_gaps:Array.from({length:5},(_,x)=>x<d.asym_north_gaps.length?String(E.niceNumber(d.asym_north_gaps[x])):''),asym_south_gaps:Array.from({length:5},(_,x)=>x<d.asym_south_gaps.length?String(E.niceNumber(d.asym_south_gaps[x])):'')};
  }
}
function customRuleEditorHtml(){
  const r=uiState.customRule;let html='';
  if(r.mode==='Symmetrical'){
    html+=`<div class="form-row"><label>Identical Distance Between Bearing Posts (mm)</label><input id="crSym" value="${escapeHtml(r.symmetrical_distance)}"><span></span></div>`;
  }else if(r.mode==='Semi-symmetrical'){
    html+=`<div class="form-row"><label>Number of Bearing Post Pairs</label><select id="crSemiCount">${[1,2,3,4,5].map(v=>`<option ${v===Number(r.semi_pair_count)?'selected':''}>${v}</option>`).join('')}</select><span></span></div>`;
    for(let pair=1;pair<=Number(r.semi_pair_count);pair++){
      const label=pair===1?'Main Post to Pair ±1 (mm)':`Pair ±${pair-1} to Pair ±${pair} (mm)`;html+=`<div class="form-row"><label>${label}</label><input data-cr-semi="${pair-1}" value="${escapeHtml(r.semi_pair_gaps[pair-1]||'')}"><span></span></div>`;
    }
  }else{
    html+=`<div class="form-row"><label>Number of Bearing Posts Per Side</label><select id="crAsymCount">${[1,2,3,4,5].map(v=>`<option ${v===Number(r.asym_post_count)?'selected':''}>${v}</option>`).join('')}</select><span></span></div><h3 class="section-title compact" style="font-size:15px">North Side</h3>`;
    for(let pair=1;pair<=Number(r.asym_post_count);pair++){const label=pair===1?'Main Post to North 1 (mm)':`North ${pair-1} to North ${pair} (mm)`;html+=`<div class="form-row"><label>${label}</label><input data-cr-north="${pair-1}" value="${escapeHtml(r.asym_north_gaps[pair-1]||'')}"><span></span></div>`;}
    html+='<h3 class="section-title compact" style="font-size:15px">South Side</h3>';
    for(let pair=1;pair<=Number(r.asym_post_count);pair++){const label=pair===1?'Main Post to South 1 (mm)':`South ${pair-1} to South ${pair} (mm)`;html+=`<div class="form-row"><label>${label}</label><input data-cr-south="${pair-1}" value="${escapeHtml(r.asym_south_gaps[pair-1]||'')}"><span></span></div>`;}
  }
  return html;
}
function ruleToTableValues(pv,rule){
  const r=E.normalizeBearingRule(rule);if(r.mode==='Symmetrical')return [`${pv}-PV`,r.mode,'Auto',E.niceNumber(r.symmetrical_distance),'Same as North'];
  if(r.mode==='Semi-symmetrical')return [`${pv}-PV`,r.mode,r.semi_pair_gaps.length,r.semi_pair_gaps.map(E.niceNumber).join(', '),'Same as North'];
  return [`${pv}-PV`,r.mode,r.asym_north_gaps.length,r.asym_north_gaps.map(E.niceNumber).join(', '),r.asym_south_gaps.map(E.niceNumber).join(', ')];
}
function renderBearingConfig(){
  const root=document.getElementById('bearingConfig');if(!root)return;const p=getActiveProject();const cad=E.cadBlocksAreAvailable(p);
  if(cad){
    root.innerHTML=`<div class="bearing-top"><label>Array Type</label><select id="crPv">${Array.from({length:43},(_,i)=>i+14).map(v=>`<option ${String(v)===String(uiState.customRule.pv)?'selected':''}>${v}</option>`).join('')}</select><label>Mode</label><select id="crMode">${['Symmetrical','Semi-symmetrical','Asymmetrical'].map(v=>`<option ${v===uiState.customRule.mode?'selected':''}>${v}</option>`).join('')}</select></div><div id="bearingEditor" class="bearing-editor">${customRuleEditorHtml()}</div><div class="action-row"><button id="crAdd">Add / Update Array Rule</button><button id="crLoad">Load Selected Rule</button><button id="crDelete">Delete Selected Rule</button></div><div id="bearingSummary"></div>`;
    document.getElementById('crPv').addEventListener('change',e=>{uiState.customRule.pv=e.target.value;syncCustomRuleFromProject(e.target.value);customRuleSelectedPv=Number(e.target.value);renderBearingConfig();});
    document.getElementById('crMode').addEventListener('change',e=>{uiState.customRule.mode=e.target.value;renderBearingConfig();});
    bindCustomRuleFields();
    document.getElementById('crAdd').addEventListener('click',()=>{
      readCustomRuleFields();const r=uiState.customRule;const pv=Number(r.pv);const semiCount=Math.max(1,Math.min(5,Number(r.semi_pair_count)||1));const asymCount=Math.max(1,Math.min(5,Number(r.asym_post_count)||1));
      p.bearing_rules[String(pv)]={locked:false,mode:r.mode,symmetrical_distance:E.asNumber(r.symmetrical_distance,0),semi_pair_count:semiCount,asym_post_count:asymCount,semi_pair_gaps:r.semi_pair_gaps.slice(0,semiCount).map(v=>E.asNumber(v,0)),asym_north_gaps:r.asym_north_gaps.slice(0,asymCount).map(v=>E.asNumber(v,0)),asym_south_gaps:r.asym_south_gaps.slice(0,asymCount).map(v=>E.asNumber(v,0))};customRuleSelectedPv=pv;markDirty();refreshOutputsOnly();renderBearingSummaryOnly();showToast(`${pv}-PV bearing rule updated.`);
    });
    document.getElementById('crLoad').addEventListener('click',()=>{if(customRuleSelectedPv==null){showToast('Select a custom bearing rule from the table first.');return;}syncCustomRuleFromProject(customRuleSelectedPv);renderBearingConfig();});
    document.getElementById('crDelete').addEventListener('click',()=>{if(customRuleSelectedPv==null||!p.bearing_rules[String(customRuleSelectedPv)]){showToast('Select a custom bearing rule from the table first.');return;}const pv=customRuleSelectedPv;if(!confirm(`Delete the custom bearing rule for ${pv}-PV?\n\nThe array type will return to the default bearing rule.`))return;delete p.bearing_rules[String(pv)];customRuleSelectedPv=null;markDirty();refreshOutputsOnly();renderBearingConfig();});
    renderBearingSummaryOnly();
  }else{
    const maxSpan=iValue('max_span_length',p.inputs.max_span_length);const limits=E.getSpanLimits(p);root.innerHTML=`<div class="bearing-top"><label>Array Type</label><select disabled><option>${escapeHtml(uiState.customRule.pv)}</option></select><label>Mode</label><strong>Symmetrical</strong><label>Max Span Length (mm)</label><input id="estMaxSpan" value="${escapeHtml(maxSpan)}"></div><p class="subtitle">Estimation mode: span means the distance between two bearing posts. Tracker span type is selected from total tracker length.</p><div class="table-wrap framed"><table><thead><tr><th>Tracker Type</th><th>Max Tracker Length (mm)</th><th>Bearing Posts</th></tr></thead><tbody>${[2,4,6,8].map(s=>`<tr><td>${s}-Span</td><td>${escapeHtml(E.niceNumber(limits[s]))}</td><td>${s} Bearing posts</td></tr>`).join('')}</tbody></table></div><div id="bearingSummary"></div>`;
    document.getElementById('estMaxSpan').addEventListener('input',e=>{p.inputs.max_span_length=e.target.value;markDirty();refreshOutputsOnly();renderBearingSummaryOnly();});renderBearingSummaryOnly();
  }
}
function iValue(_key,value){return value==null?'':String(value);}
function bindCustomRuleFields(){
  const r=uiState.customRule;document.getElementById('crSym')?.addEventListener('input',e=>r.symmetrical_distance=e.target.value);
  document.getElementById('crSemiCount')?.addEventListener('change',e=>{r.semi_pair_count=Number(e.target.value);renderBearingConfig();});
  document.getElementById('crAsymCount')?.addEventListener('change',e=>{r.asym_post_count=Number(e.target.value);renderBearingConfig();});
  document.querySelectorAll('[data-cr-semi]').forEach(el=>el.addEventListener('input',()=>r.semi_pair_gaps[Number(el.dataset.crSemi)]=el.value));
  document.querySelectorAll('[data-cr-north]').forEach(el=>el.addEventListener('input',()=>r.asym_north_gaps[Number(el.dataset.crNorth)]=el.value));
  document.querySelectorAll('[data-cr-south]').forEach(el=>el.addEventListener('input',()=>r.asym_south_gaps[Number(el.dataset.crSouth)]=el.value));
}
function readCustomRuleFields(){
  const r=uiState.customRule;const sym=document.getElementById('crSym');if(sym)r.symmetrical_distance=sym.value;
  const sc=document.getElementById('crSemiCount');if(sc)r.semi_pair_count=Number(sc.value);const ac=document.getElementById('crAsymCount');if(ac)r.asym_post_count=Number(ac.value);
  document.querySelectorAll('[data-cr-semi]').forEach(el=>r.semi_pair_gaps[Number(el.dataset.crSemi)]=el.value);document.querySelectorAll('[data-cr-north]').forEach(el=>r.asym_north_gaps[Number(el.dataset.crNorth)]=el.value);document.querySelectorAll('[data-cr-south]').forEach(el=>r.asym_south_gaps[Number(el.dataset.crSouth)]=el.value);
}
function renderBearingSummaryOnly(){
  const root=document.getElementById('bearingSummary');if(!root||!current)return;const p=getActiveProject();
  if(E.cadBlocksAreAvailable(p)){
    const rows=Object.keys(p.bearing_rules).sort((a,b)=>Number(a)-Number(b)).map(pv=>ruleToTableValues(Number(pv),p.bearing_rules[pv]));
    root.innerHTML=makeArrayTable(['Array Type','Mode','Posts / Pairs','North / Pair Distances','South Distances'],rows,{rawArrays:true});
    wireTableRowClicks(root,rows,(tr,row)=>{root.querySelectorAll('tbody tr').forEach(x=>x.classList.remove('row-selected'));tr.classList.add('row-selected');customRuleSelectedPv=Number(String(row[0]).replace('-PV',''));});
    root.querySelectorAll('tbody tr[data-row-index]').forEach(tr=>tr.addEventListener('dblclick',()=>{const row=rows[Number(tr.dataset.rowIndex)];customRuleSelectedPv=Number(String(row[0]).replace('-PV',''));syncCustomRuleFromProject(customRuleSelectedPv);renderBearingConfig();}));
    if(customRuleSelectedPv!=null){[...root.querySelectorAll('tbody tr')].forEach(tr=>{if(tr.cells[0]?.textContent===`${customRuleSelectedPv}-PV`)tr.classList.add('row-selected');});}
  }else{
    const rows=current.schedule.map(row=>[`${row['PV Modules per Tracker']}-PV`,'Symmetrical',E.niceNumber(E.asNumber(p.inputs.max_span_length,7900)),E.niceNumber(row['Tracker Length (mm)']),row['Span Type'],row['Bearing Posts / Tracker']]);
    root.innerHTML=makeArrayTable(['Array Type','Mode','Max Span Length (mm)','Tracker Length (mm)','Tracker Type','Bearing Posts'],rows,{rawArrays:true});
  }
}
function nextManualKey(){
  const p=getActiveProject();let n=1;while(p.manual_parts[`manual_${n}`])n++;return `manual_${n}`;
}
function renderManualParts(){
  const root=document.getElementById('manualParts');if(!root)return;const p=getActiveProject();const fields=['Item','qty','TAG','Description','Part Number','Category','Unit'];
  const rows=Object.entries(p.manual_parts).map(([key,v])=>`<tr data-manual-key="${escapeHtml(key)}"><td><input type="checkbox" data-manual="selected" ${v.selected?'checked':''}></td><td><input type="checkbox" data-manual="include" ${v.include?'checked':''}></td>${fields.map(f=>`<td><input data-manual="${escapeHtml(f)}" value="${escapeHtml(v[f]??'')}"></td>`).join('')}</tr>`).join('');
  root.innerHTML=`<div class="table-wrap"><table class="manual-table"><thead><tr>${['Select','Include','Item','Qty','TAG','Description','Part Number','Category','Unit'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><div class="action-row"><button id="manualAdd">Add Row</button><button id="manualDelete">Delete Selected Row</button></div>`;
  root.querySelectorAll('[data-manual-key]').forEach(tr=>{const key=tr.dataset.manualKey;tr.querySelectorAll('[data-manual]').forEach(el=>{const field=el.dataset.manual;const ev=el.type==='checkbox'?'change':'input';el.addEventListener(ev,()=>{p.manual_parts[key][field]=el.type==='checkbox'?el.checked:el.value;markDirty();if(field!=='selected')refreshOutputsOnly();});});});
  document.getElementById('manualAdd').addEventListener('click',()=>{const key=nextManualKey();p.manual_parts[key]={selected:false,include:false,Item:'',qty:'0',TAG:'',Description:'','Part Number':'',Category:'',Unit:'',_default:false};markDirty();renderManualParts();refreshOutputsOnly();});
  document.getElementById('manualDelete').addEventListener('click',()=>{const selected=Object.entries(p.manual_parts).filter(([,v])=>v.selected);if(!selected.length){showToast('Select at least one manual standard part row to delete.');return;}let removed=0,kept=0;for(const [key,v] of selected){if(v._default){v.selected=false;kept++;}else{delete p.manual_parts[key];removed++;}}if(kept&&!removed)showToast('Default Safeguard and Datalogger rows are kept. You can clear or disable them instead.');markDirty();renderManualParts();refreshOutputsOnly();});
}

function displayValue(value){return value===null||value===undefined?'':String(E.niceNumber(value));}
function makeArrayTable(columns,rows,options={}){
  const rawArrays=!!options.rawArrays;
  const html=`<div class="table-wrap ${options.framed?'framed':''}"><table><thead><tr>${columns.map(c=>`<th class="${c==='Reason'?'wrap':''}">${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((row,ri)=>`<tr data-row-index="${ri}">${columns.map((c,ci)=>{const v=rawArrays?row[ci]:row?.[c];const cls=c==='Reason'?'wrap':(c==='Status'||c==='Bearing Status'?(String(v)==='OK'?'status-ok':'status-warning'):'');return `<td class="${cls}">${escapeHtml(displayValue(v))}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(!options.clickRow)return html;
  const holder=document.createElement('div');holder.innerHTML=html;holder.querySelectorAll('tbody tr').forEach(tr=>{const row=rows[Number(tr.dataset.rowIndex)];tr.addEventListener('click',()=>options.clickRow(tr,row));});return holder.innerHTML;
}
function wireTableRowClicks(root,rows,handler){
  root.querySelectorAll('tbody tr[data-row-index]').forEach(tr=>tr.addEventListener('click',()=>handler(tr,rows[Number(tr.dataset.rowIndex)])));
}
function keepInlineEditorActive(input){
  input.addEventListener('click',event=>event.stopPropagation());input.addEventListener('dblclick',event=>event.stopPropagation());
}
function renderArrayTable(){
  const root=document.getElementById('tabArray');const cols=['PV / Tracker','Number of Trackers','Tracker Type','Span Type','Bearing Rule','PV Gaps / Side','Tracker Length (mm)','Main Beam C','Bearing Posts / Tracker','Bearing 120','Bearing 110','Bearing 100','K001099 / Tracker','Status'];
  const rows=current.schedule.map(r=>{
    const cNorth=E.asNumber(r['Main Beam C Required Length North'],0),cSouth=E.asNumber(r['Main Beam C Required Length South'],0);let c='Not required';
    if(cNorth>0||cSouth>0)c=`${displayValue(r['Main Beam C Required Length'])} (${r['Main Beam C Stock Suggestion']})`;
    return [r['PV Modules per Tracker'],r['Number of Trackers'],r['Tracker Type'],r['Span Type'],r['Bearing Rule Source'],r['PV Gaps / Side'],r['Tracker Length (mm)'],c,r['Bearing Posts / Tracker'],r['Bearing 120 / Tracker'],r['Bearing 110 / Tracker'],r['Bearing 100 / Tracker'],r['Module Support Plates / Tracker'],r['Bearing Status']];
  });
  root.innerHTML=`<h2 class="table-title">Plant Array Table</h2><p class="table-subtitle">Double-click the Number of Trackers cell to edit quantity.</p>${makeArrayTable(cols,rows,{rawArrays:true})}`;
  const trs=root.querySelectorAll('tbody tr');trs.forEach((tr,index)=>{const cell=tr.cells[1];cell.style.background='#FFF5E4';cell.title='Double-click to edit';cell.addEventListener('dblclick',()=>editArrayQtyCell(cell,current.schedule[index]['PV Modules per Tracker']));});
}
function editArrayQtyCell(cell,pv){
  if(cell.querySelector('input'))return;const p=getActiveProject();const old=p.tracker_quantities[String(pv)]??0;cell.innerHTML=`<input class="qty-input" type="number" min="0" step="1" value="${escapeHtml(old)}">`;const input=cell.querySelector('input');keepInlineEditorActive(input);input.focus();input.select();let done=false;
  const save=()=>{if(done)return;done=true;let v=Number(input.value);if(!Number.isFinite(v)||v<0)v=0;v=Math.trunc(v);p.tracker_quantities[String(pv)]=v;markDirty();refreshOutputsOnly();};input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();save();}if(e.key==='Escape'){done=true;renderArrayTable();}});input.addEventListener('blur',save);
}
function renderSelectedArrays(){
  document.getElementById('tabSelected').innerHTML=makeArrayTable(SELECTED_ARRAY_COLUMNS,current.active);
}
function renderBearingLayout(){document.getElementById('tabBearing').innerHTML=makeArrayTable(BEARING_COLUMNS,current.bearing);}
function renderSupport(){
  const summary=current.active.map(r=>({'PV Modules per Tracker':r['PV Modules per Tracker'],'Number of Trackers':r['Number of Trackers'],'PV Module Support Plate / Single Tracker':r['Module Support Plates / Tracker'],'Total PV Module Support Plate Qty':E.asInt(r['Module Support Plates / Tracker'])*E.asInt(r['Number of Trackers'])}));
  const sc=['PV Modules per Tracker','Number of Trackers','PV Module Support Plate / Single Tracker','Total PV Module Support Plate Qty'];
  document.getElementById('tabSupport').innerHTML=`<h2 class="table-title">PV Module Support Plate Quantity by Selected Array</h2>${makeArrayTable(sc,summary)}<h2 class="table-title" style="margin-top:14px">Detailed rail-by-rail calculation</h2>${makeArrayTable(SUPPORT_DETAIL_COLUMNS,current.support)}`;
}
function rowMatchesSearch(row,text){
  const words=String(text||'').trim().split(/\s+/).map(E.normalizeText).filter(Boolean);if(!words.length)return true;const combined=E.normalizeText(Object.values(row||{}).filter(v=>v!==null&&v!==undefined).join(' '));return words.every(w=>combined.includes(w));
}
function renderBom(){
  const root=document.getElementById('tabBom'),p=getActiveProject();const filtered=current.bom.rows.filter(r=>rowMatchesSearch(r,uiState.projectBomSearch));
  const contingencyPercent=Math.min(100,Math.max(0,E.asNumber(p.fastener_contingency_percent,0)));
  const soltrkVersion=E.normalizeSoltrkVersion(p.soltrk_version);
  root.innerHTML=`<div class="bom-controls"><label class="bom-contingency-toggle"><input id="bomContingencyEnabled" type="checkbox" ${p.contingency_enabled?'checked':''}> Contingency</label><label class="bom-contingency-percent" for="bomContingencyPercent">Fasteners (%) <input id="bomContingencyPercent" type="number" min="0" max="100" step="0.1" value="${escapeHtml(E.niceNumber(contingencyPercent))}" ${p.contingency_enabled?'':'disabled'}></label><label><input id="bomMetadataEnabled" type="checkbox" ${p.bom_metadata_enabled!==false?'checked':''}> Material / Weight</label><label for="bomSoltrkVersion">SOLTRK Version <select id="bomSoltrkVersion">${['2.0','3.0'].map(version=>`<option value="${version}" ${version===soltrkVersion?'selected':''}>SOLTRK ${version}</option>`).join('')}</select></label></div><div class="search-row"><label>Search:</label><input id="bomSearchInput" value="${escapeHtml(uiState.projectBomSearch)}" placeholder="Search Project BOM by Part, TAG, Description, Category, quantity..."><button id="bomSearchBtn">Search</button><button id="bomClearBtn">Clear</button></div>${makeArrayTable(current.bom.columns,filtered)}`;
  document.getElementById('bomContingencyEnabled').addEventListener('change',e=>{p.contingency_enabled=e.target.checked;markDirty();refreshOutputsOnly();});
  document.getElementById('bomContingencyPercent').addEventListener('change',e=>{const value=Math.min(100,Math.max(0,E.asNumber(e.target.value,0)));p.fastener_contingency_percent=value;markDirty();refreshOutputsOnly();});
  document.getElementById('bomMetadataEnabled').addEventListener('change',e=>{p.bom_metadata_enabled=e.target.checked;markDirty();refreshOutputsOnly();});
  document.getElementById('bomSoltrkVersion').addEventListener('change',e=>{p.soltrk_version=E.normalizeSoltrkVersion(e.target.value);markDirty();refreshOutputsOnly();});
  root.querySelectorAll('tbody tr').forEach((tr,displayIndex)=>{
    const row=filtered[displayIndex],key=row._bom_key;
    if(selectedBomRows.has(key))tr.classList.add('row-selected');
    tr.addEventListener('click',e=>{if(e.target.closest('input,select,textarea,button')||e.detail>1)return;if(e.ctrlKey||e.metaKey){selectedBomRows.has(key)?selectedBomRows.delete(key):selectedBomRows.add(key);}else{selectedBomRows.clear();selectedBomRows.add(key);}root.querySelectorAll('tbody tr').forEach((tableRow,index)=>tableRow.classList.toggle('row-selected',selectedBomRows.has(filtered[index]._bom_key)));});
    tr.querySelectorAll('td').forEach((td,columnIndex)=>{
      const column=current.bom.columns[columnIndex],editableMetadata=column==='Material'||column==='Weight',editableQuantity=column==='Total Qty'&&!!row._quantity_override_key;
      if(editableMetadata||editableQuantity){td.classList.add('bom-editable-cell');td.title=editableQuantity?'Double-click to set the manual total; clear the value to restore automatic quantity.':'Double-click to edit.';td.addEventListener('dblclick',e=>{e.stopPropagation();editBomCell(td,row,column);});}
    });
  });
  const search=()=>{uiState.projectBomSearch=document.getElementById('bomSearchInput').value;renderBom();updateFixedHorizontalScroll();};document.getElementById('bomSearchBtn').addEventListener('click',search);document.getElementById('bomSearchInput').addEventListener('keydown',e=>{if(e.key==='Enter')search();});document.getElementById('bomClearBtn').addEventListener('click',()=>{uiState.projectBomSearch='';renderBom();updateFixedHorizontalScroll();});
}
function editBomCell(td,row,column){
  if(td.querySelector('input'))return;const p=getActiveProject(),isQuantity=column==='Total Qty';const old=isQuantity?row['Total Qty']:(row[column]??'');
  td.innerHTML=`<input class="bom-cell-input" ${isQuantity?'type="number" min="0" step="1"':''} value="${escapeHtml(old)}">`;const input=td.querySelector('input');keepInlineEditorActive(input);input.focus();input.select();let done=false;
  const save=()=>{if(done)return;done=true;if(isQuantity){const key=row._quantity_override_key,value=input.value.trim();p.equipment_quantity_overrides=p.equipment_quantity_overrides||{};if(value==='')delete p.equipment_quantity_overrides[key];else p.equipment_quantity_overrides[key]=Math.max(0,Math.trunc(E.asNumber(value,0)));}else{p.bom_overrides=p.bom_overrides||{};p.bom_overrides[row._bom_key]=p.bom_overrides[row._bom_key]||{};p.bom_overrides[row._bom_key][column]=input.value;}markDirty();refreshOutputsOnly();};
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();save();}else if(e.key==='Escape'){done=true;renderBom();}});input.addEventListener('blur',save);
}
function renderPartMaster(){
  const root=document.getElementById('tabPartMaster');const filtered=current.partMasterPreview.filter(r=>rowMatchesSearch(r,uiState.partMasterSearch));
  root.innerHTML=`<div class="part-controls"><label>Part Master List:</label><span class="list-name">${escapeHtml(currentPartMasterListName)}</span><button id="pmSave">Save Part Master As...</button><button id="pmLoad">Load Saved Part Master...</button><button id="pmReset">Reset to Default Part Master</button><button id="pmDelete">Delete Selected Part(s)</button></div><p class="table-subtitle">Double-click Part, TAG, Description, Part Number, or Category to edit. Select one or more rows and click Delete Selected Part(s) to remove them.</p><div class="search-row"><label>Search:</label><input id="pmSearchInput" value="${escapeHtml(uiState.partMasterSearch)}" placeholder="Search Part Master by Part, TAG, Description, Category, calculation note..."><button id="pmSearchBtn">Search</button><button id="pmClearBtn">Clear</button></div>${makeArrayTable(PART_PREVIEW_COLUMNS,filtered)}`;
  const tableRows=root.querySelectorAll('tbody tr');tableRows.forEach((tr,displayIndex)=>{const row=filtered[displayIndex],idx=row._part_master_index;if(selectedPartMasterRows.has(idx))tr.classList.add('row-selected');tr.addEventListener('click',e=>{if(e.target.closest('input,select,textarea,button')||e.detail>1)return;if(e.ctrlKey||e.metaKey){selectedPartMasterRows.has(idx)?selectedPartMasterRows.delete(idx):selectedPartMasterRows.add(idx);}else{selectedPartMasterRows.clear();selectedPartMasterRows.add(idx);}renderPartMaster();});tr.querySelectorAll('td').forEach((td,ci)=>{const col=PART_PREVIEW_COLUMNS[ci];if(PART_EDITABLE_COLUMNS.has(col))td.addEventListener('dblclick',e=>{e.stopPropagation();editPartMasterCell(td,idx,col);});});});
  const search=()=>{uiState.partMasterSearch=document.getElementById('pmSearchInput').value;renderPartMaster();updateFixedHorizontalScroll();};document.getElementById('pmSearchBtn').addEventListener('click',search);document.getElementById('pmSearchInput').addEventListener('keydown',e=>{if(e.key==='Enter')search();});document.getElementById('pmClearBtn').addEventListener('click',()=>{uiState.partMasterSearch='';renderPartMaster();updateFixedHorizontalScroll();});
  document.getElementById('pmSave').addEventListener('click',savePartMasterAs);document.getElementById('pmLoad').addEventListener('click',()=>document.getElementById('partMasterFileInput').click());document.getElementById('pmReset').addEventListener('click',resetPartMaster);document.getElementById('pmDelete').addEventListener('click',deleteSelectedPartMaster);
}
function editPartMasterCell(td,index,column){
  if(td.querySelector('input'))return;const storage=column==='Part Name'?'Part':column;const record=partMaster[index];const old=record[storage]??'';td.innerHTML=`<input value="${escapeHtml(old)}" style="width:100%;min-width:120px">`;const input=td.querySelector('input');keepInlineEditorActive(input);input.focus();input.select();let done=false;
  const save=()=>{if(done)return;done=true;record[storage]=input.value;workspaceStructureDirty=true;getActiveProject().is_dirty=true;saveRecovery();recalculate();renderOutputTabsExceptInputs();refreshProjectList();};input.addEventListener('keydown',e=>{if(e.key==='Enter')save();else if(e.key==='Escape'){done=true;renderPartMaster();}});input.addEventListener('blur',save);
}
function savePartMasterAs(){
  openModal('Save Part Master As',formRowHtml('Part Master List Name','pmSaveName',currentPartMasterListName==='Default Internal'?'My Part Master':currentPartMasterListName),[
    {text:'Cancel',onClick:closeModal},{text:'Save',onClick:async()=>{const name=document.getElementById('pmSaveName').value.trim();if(!name)return;const payload={name,saved_at:formatDateTime(),columns:[...partMasterColumns],rows:partMaster.map(r=>Object.fromEntries(partMasterColumns.map(c=>[c,r[c]??''])))};const filename=`${safeFilename(name)}.json`;const result=await saveBlobWithLocation(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),filename,'Part Master JSON',{'application/json':['.json']});if(!result.saved)return;currentPartMasterListName=name;workspaceStructureDirty=true;closeModal();renderPartMaster();saveRecovery();showToast(result.picker?'Part Master saved.':'Part Master downloaded.');}}
  ]);
}
function resetPartMaster(){if(!confirm('Reset the shared Part Master to the protected internal default list?'))return;partMaster=E.loadInternalPartMaster();partMasterColumns=[...INTERNAL_PART_MASTER_COLUMNS];currentPartMasterListName='Default Internal';selectedPartMasterRows.clear();workspaceStructureDirty=true;Object.values(workspace.projects).forEach(p=>p.is_dirty=true);recalculate();renderAll(false);saveRecovery();}
function deleteSelectedPartMaster(){
  if(!selectedPartMasterRows.size){showToast('Select one or more Part Master rows to delete.');return;}if(selectedPartMasterRows.size>=partMaster.length){showToast('The Part Master must contain at least one part.');return;}if(!confirm(`Delete ${selectedPartMasterRows.size} selected Part Master row(s)?\n\nThis changes the shared Part Master for every project in this workspace.`))return;
  partMaster=partMaster.filter((_,i)=>!selectedPartMasterRows.has(i));selectedPartMasterRows.clear();workspaceStructureDirty=true;Object.values(workspace.projects).forEach(p=>p.is_dirty=true);recalculate();renderAll(false);saveRecovery();
}

function logicOptions(){return current.active.length?current.active:current.schedule;}
function ensureLogicSelection(){
  const p=getActiveProject(),opts=logicOptions().map(r=>String(r['PV Modules per Tracker']));if(!opts.includes(String(p.selected_logic_pv)))p.selected_logic_pv=opts[0]||'';
}
function buildLogicText(){
  ensureLogicSelection();const p=getActiveProject(),pv=Number(p.selected_logic_pv);const row=current.schedule.find(r=>Number(r['PV Modules per Tracker'])===pv);if(!row)return 'No calculation available.';
  const d=E.getDesignInputs(p),bearingRule=E.getBearingRuleForPv(p,pv),n=E.niceNumber;const lines=[];
  lines.push('CALCULATION LOGIC','='.repeat(90),'',`Selected PV Modules / Tracker = ${pv}`,`Tracker Type = ${row['Tracker Type']}`,`Bearing Rule Source = ${row['Bearing Rule Source']}`,`Bearing Rule Mode = ${bearingRule.mode||''}`,`BOM Mode = ${E.getBomModeText(p)}`,`Span Type = ${row['Span Type']||'CAD Block'}`,'');
  lines.push('1) PV MODULE GAP CALCULATION','-'.repeat(90),'PV Module Gap = PV Module Transverse Hole Distance + Hat Rail Hole Distance - PV Module Width',`= ${n(d.pv_module_hole_distance)} + ${n(d.hat_rail_hole_distance)} - ${n(d.pv_module_width)}`,`= ${n(d.pv_module_gap)} mm`,`Gap locked = ${p.inputs.pv_gap_locked?'Yes':'No'}`,'');
  lines.push('2) TRACKER LENGTH CALCULATION','-'.repeat(90),'Required side envelope = Motor Gap / 2 + Modules × PV Module Width + PV gaps × PV Module Gap + Target End Gap',`Required North Side = ${n(row['Required North Side'])} mm`,`Required South Side = ${n(row['Required South Side'])} mm`, '');
  if(E.cadBlocksAreAvailable(p))lines.push('CAD Block tracker length = North structural end + South structural end',`= ${n(row['Main Beam C End North from Midplane'])} + ${n(row['Main Beam C End South from Midplane'])}`,`= ${n(row['Tracker Length (mm)'])} mm`,'');
  else lines.push('Estimation tracker length = Required North Side + Required South Side',`= ${n(row['Required North Side'])} + ${n(row['Required South Side'])}`,`= ${n(row['Tracker Length (mm)'])} mm`,'');
  lines.push('3) BEARING TYPE CALCULATION','-'.repeat(90));
  if(E.cadBlocksAreAvailable(p))lines.push('CAD Blocks Availability = Yes. The app first checks whether this PV type has a custom bearing rule.','If yes, it uses the custom rule. If no, it uses the default CAD-block bearing rule.','');
  else lines.push('CAD Blocks Availability = No. The app estimates the span type from total tracker length.','Max tracker length = Span count × Max Span + 2 × Max Span × 0.35.','The selected span type defines the bearing post quantity: 2, 4, 6, or 8 bearing posts.','');
  lines.push('Each bearing post position is calculated from the mid-plane / main post.','Then the absolute position is compared with main beam zones.','','If |position| <= Zone A End, bearing type = Bearing 120','Else if |position| <= Zone B End, bearing type = Bearing 110','Else if |position| <= Zone C End, bearing type = Bearing 100','',`Zone A End = ${n(row['Zone A End (120)'])} mm`,`Zone B End = ${n(row['Zone B End (110)'])} mm`,`Zone C End = ${n(row['Main Beam C End from Midplane'])} mm`,'');
  // Previous K001099 calculation log (kept for future restoration):
  // const first=d.motor_gap/2+(d.pv_module_width-d.pv_module_hole_distance)/2+d.z_rail_offset;
  // lines.push('4) MODULE SUPPORT PLATE K001099 CALCULATION','-'.repeat(90),'Rail positions are calculated from mid-plane on one side, then mirrored to the other side.','','First rail position:','Motor Gap / 2 + (PV Module Width - PV Module Transverse Hole Distance) / 2 + Z Rail Offset',`= ${n(d.motor_gap)} / 2 + (${n(d.pv_module_width)} - ${n(d.pv_module_hole_distance)}) / 2 + ${n(d.z_rail_offset)}`,`= ${n(first)} mm`,'','Second rail position increment:','PV Module Transverse Hole Distance + Hat Rail Hole Distance / 2 - Z Rail Offset','','Next rail increment:','PV Module Transverse Hole Distance + Hat Rail Hole Distance','','Support plate rules:','Base condition: each module rail has minimum 1 support plate.','Bearing 110: closest left/right rails get 2 plates.','Bearing 100: closest left/right rails get 4 plates.','Taper rule: 4 → 3 → 2 → 1, or 2 → 1.','Beam height compensation:','A/120 level = 0, B/110 level = 1, C/100 level = 2.','Corrected formula:','Final plates = max(1, taper plates + rail beam level - bearing beam level)','The bearing beam level is used as the reference, not the nearest rail beam level.','',`Module Support Plates / Side = ${n(row['Module Support Plates / Side'])}`,`Module Support Plates / Tracker = ${n(row['Module Support Plates / Tracker'])}`);
  const hatRailQty=Math.max(E.asInt(row['PV Modules per Tracker'])-2,0);
  const zRailQty=4;
  lines.push('4) MODULE SUPPORT PLATE K001099 / PLUSS00173BZ00 CALCULATION','-'.repeat(90),'TEMPORARY CALCULATION NOTE:','PV Module Support Plate quantity is temporarily calculated as Hat rail + Z rail.','',`Hat rail / Tracker = ${n(hatRailQty)}`,`Z rail / Tracker = ${n(zRailQty)}`,`Module Support Plates / Tracker = ${n(hatRailQty)} + ${n(zRailQty)} = ${n(row['Module Support Plates / Tracker'])}`,`Module Support Plates / Side = ${n(row['Module Support Plates / Side'])}`);
  return lines.join('\n');
}
function renderLogic(){
  ensureLogicSelection();const p=getActiveProject(),opts=logicOptions();const root=document.getElementById('tabLogic');root.innerHTML=`<div class="logic-top"><label>Show logic for PV / Tracker:</label><select id="logicPv">${opts.map(r=>{const v=String(r['PV Modules per Tracker']);return `<option ${v===String(p.selected_logic_pv)?'selected':''}>${v}</option>`;}).join('')}</select></div><div class="logic-box">${escapeHtml(buildLogicText())}</div>`;
  document.getElementById('logicPv').addEventListener('change',e=>{p.selected_logic_pv=e.target.value;p.is_dirty=true;saveRecovery();renderLogic();});
}
function sketchOptions(){return current.active.length?current.active:current.schedule;}
function ensureSketchSelection(){const p=getActiveProject(),opts=sketchOptions().map(r=>String(r['PV Modules per Tracker']));if(!opts.includes(String(p.selected_sketch_pv)))p.selected_sketch_pv=opts[0]||'';}
function svgEsc(v){return escapeHtml(v);}
function buildSketchSvg(row,width=1200,height=700){
  const n=E.niceNumber;const centerY=height/2+15,leftMargin=90,rightMargin=230;
  const zoneA=E.asNumber(row['Zone A End (120)'],0),zoneB=E.asNumber(row['Zone B End (110)'],0),zoneCN=E.asNumber(row['Main Beam C End North from Midplane']??row['Main Beam C End from Midplane'],0),zoneCS=E.asNumber(row['Main Beam C End South from Midplane']??row['Main Beam C End from Midplane'],0),cStart=E.asNumber(row['Main Beam C Start from Midplane']??row['Base Until C']??zoneB,zoneB),cEndN=E.asNumber(row['Main Beam C Actual End North from Midplane']??cStart,cStart),cEndS=E.asNumber(row['Main Beam C Actual End South from Midplane']??cStart,cStart),cReqN=E.asNumber(row['Main Beam C Required Length North'],0),cReqS=E.asNumber(row['Main Beam C Required Length South'],0),hasC=cReqN>0||cReqS>0,total=Math.max(zoneCN+zoneCS,E.asNumber(row['Tracker Length (mm)'],1),1),usable=Math.max(300,width-leftMargin-rightMargin),scale=usable/total,centerX=leftMargin+zoneCS*scale,x=mm=>centerX+mm*scale;
  const parts=[];const rect=(x1,y1,x2,y2,fill,stroke='#111827',sw=1)=>parts.push(`<rect x="${Math.min(x1,x2)}" y="${Math.min(y1,y2)}" width="${Math.abs(x2-x1)}" height="${Math.abs(y2-y1)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);const line=(x1,y1,x2,y2,stroke,w=1)=>parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"/>`);const text=(xx,yy,t,size=10,fill='#111827',weight='normal',anchor='middle')=>parts.push(`<text x="${xx}" y="${yy}" font-family="Calibri,Arial,sans-serif" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}" dominant-baseline="middle">${svgEsc(t)}</text>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/>`);
  text(20,22,`Tracker Sketch Preview - ${row['PV Modules per Tracker']} PV`,16,'#111827','bold','start');text(20,46,`Bearing Rule: ${row['Bearing Rule Source']} | ${row['Tracker Symmetry']||'Symmetrical'}`,10,'#52616B','normal','start');
  const rails=row._module_support_rows||row._module_support_rows_right||[];const bySide={North:rails.filter(r=>(r.Side||'North')==='North').sort((a,b)=>E.asNumber(a['Distance from Mid Plane (mm)'])-E.asNumber(b['Distance from Mid Plane (mm)'])),South:rails.filter(r=>(r.Side||'North')==='South').sort((a,b)=>E.asNumber(a['Distance from Mid Plane (mm)'])-E.asNumber(b['Distance from Mid Plane (mm)']))};
  if(uiState.showPv){const top=centerY-70,bottom=centerY-28;for(const side of ['North','South']){const rr=bySide[side];for(let i=0;i<rr.length-1;i++){const p1=E.asNumber(rr[i]['Signed Distance from Mid Plane (mm)']),p2=E.asNumber(rr[i+1]['Signed Distance from Mid Plane (mm)']),x1=x(p1),x2=x(p2);rect(x1,top,x2,bottom,'#F3F4F6','#9CA3AF');const w=Math.max(Math.abs(x2-x1),1),sz=Math.max(7,Math.min(11,Math.floor(w/14)));text((x1+x2)/2,(top+bottom)/2,String(i+1),sz,'#374151','bold');}}}
  if(uiState.showBeams){const y1=centerY-8,y2=centerY+8;rect(x(-zoneB),y1,x(-zoneA),y2,'#BFDBFE','#1D4ED8');rect(x(-zoneA),y1,x(0),y2,'#C7F9CC','#15803D');if(cReqS>0)rect(x(-cEndS),y1,x(-cStart),y2,'#FDE68A','#B45309');rect(x(0),y1,x(zoneA),y2,'#C7F9CC','#15803D');rect(x(zoneA),y1,x(zoneB),y2,'#BFDBFE','#1D4ED8');if(cReqN>0)rect(x(cStart),y1,x(cEndN),y2,'#FDE68A','#B45309');}else line(x(-zoneCS),centerY,x(zoneCN),centerY,'#D1D5DB',1);
  const postTop=centerY+12,postBottom=centerY+105;line(centerX,centerY-22,centerX,postBottom+12,'#111827',3);for(const b of row._bearing_rows||[]){const pos=E.asNumber(b['Distance from Main Post (mm)']);line(x(pos),postTop,x(pos),postBottom,'#374151',2);}
  if(uiState.showRails){for(const r of rails){const pos=E.asNumber(r['Signed Distance from Mid Plane (mm)']??r['Distance from Mid Plane (mm)']);line(x(pos),centerY-82,x(pos),centerY+24,'#F28C28',4);}}
  if(uiState.showSupport){for(const r of rails){const pos=E.asNumber(r['Signed Distance from Mid Plane (mm)']??r['Distance from Mid Plane (mm)']);text(x(pos),centerY-96,String(E.asInt(r['Final Plates / Rail / Side'])),10,'#DC2626','bold');}}
  const dimY=centerY+135;line(x(-zoneCS),dimY,x(zoneCN),dimY,'#2563EB',1.5);line(x(-zoneCS),dimY-5,x(-zoneCS),dimY+5,'#2563EB');line(x(zoneCN),dimY-5,x(zoneCN),dimY+5,'#2563EB');text(centerX,dimY+16,`Tracker length: ${n(total)} mm`,10,'#2563EB','bold');if(Number(row['PV Modules per Tracker'])%2===1)text(centerX,dimY+34,`Odd PV layout: North side ${row['Modules / North Side']} modules, South side ${row['Modules / South Side']} modules`,9,'#B45309','bold');
  const distances=[...new Set((row._bearing_rows||[]).map(b=>Math.abs(E.asNumber(b['Distance from Main Post (mm)']))).filter(v=>v>0))].sort((a,b)=>a-b);distances.forEach((dist,idx)=>{const y=dimY+52+idx*18;if(y>height-26)return;for(const sign of [-1,1]){const ex=x(sign*dist);line(centerX,y,ex,y,'#2563EB',1);line(ex,y-4,ex,y+4,'#2563EB',1);}line(centerX,y-4,centerX,y+4,'#2563EB',1);text(centerX,y-8,`±${n(dist)} mm`,8,'#2563EB','bold');});
  const lx=width-rightMargin+35;let ly=57;rect(lx-12,40,width-20,260,'#FFFFFF','#D1D5DB');text(lx,ly,'Legend',12,'#111827','bold','start');ly=95;
  const legend=(color,label,kind='line',outline='#111827')=>{if(kind==='rect')rect(lx,ly-6,lx+24,ly+6,color,outline);else if(kind==='text')text(lx+12,ly,'#',10,color,'bold');else line(lx,ly,lx+24,ly,color,5);text(lx+34,ly,label,9,'#111827','normal','start');ly+=26;};
  if(uiState.showPv)legend('#F3F4F6','PV module','rect','#9CA3AF');if(uiState.showRails)legend('#F28C28','Module rail');if(uiState.showSupport)legend('#DC2626','Support plate quantity','text');if(uiState.showBeams){legend('#C7F9CC','Main Beam A / 120','rect','#15803D');legend('#BFDBFE','Main Beam B / 110','rect','#1D4ED8');if(hasC)legend('#FDE68A','Main Beam C / 100','rect','#B45309');}legend('#374151','Post reference');parts.push('</svg>');return parts.join('');
}
function renderSketch(){
  ensureSketchSelection();const p=getActiveProject(),opts=sketchOptions();const root=document.getElementById('tabSketch');root.innerHTML=`<div class="sketch-top"><label>Sketch for PV / Tracker:</label><select id="sketchPv">${opts.map(r=>{const v=String(r['PV Modules per Tracker']);return `<option ${v===String(p.selected_sketch_pv)?'selected':''}>${v}</option>`;}).join('')}</select><span class="subtitle" style="margin:0 0 0 12px">This is a simple logic sketch, not a CAD drawing.</span><button id="saveSketch" style="margin-left:auto;background:#F99A1C;color:white;border-color:#C96F00">Save High-Resolution Image</button></div><div class="sketch-options"><strong>Show:</strong>${[['PV Modules','showPv'],['Support plates','showSupport'],['Module Rails','showRails'],['Main Beams','showBeams']].map(([label,key])=>`<label><input type="checkbox" data-sketch-option="${key}" ${uiState[key]?'checked':''}> ${label}</label>`).join('')}</div><div id="sketchBox" class="sketch-box"></div>`;
  document.getElementById('sketchPv').addEventListener('change',e=>{p.selected_sketch_pv=e.target.value;p.is_dirty=true;saveRecovery();drawSketch();});root.querySelectorAll('[data-sketch-option]').forEach(cb=>cb.addEventListener('change',()=>{uiState[cb.dataset.sketchOption]=cb.checked;drawSketch();}));document.getElementById('saveSketch').addEventListener('click',saveHighResSketch);drawSketch();
}
function drawSketch(){
  const box=document.getElementById('sketchBox');if(!box||!current)return;ensureSketchSelection();const pv=Number(getActiveProject().selected_sketch_pv),row=current.schedule.find(r=>Number(r['PV Modules per Tracker'])===pv);box.innerHTML=row?buildSketchSvg(row,1200,700):'<div style="padding:20px">No data available.</div>';
}
function pngCrcTable(){if(pngCrcTable.table)return pngCrcTable.table;const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return pngCrcTable.table=t;}
function crc32Png(bytes){let c=0xffffffff,t=pngCrcTable();for(const b of bytes)c=t[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function setBe32(view,offset,n){view.setUint32(offset,n>>>0,false);}
async function addPng300Dpi(blob){
  const bytes=new Uint8Array(await blob.arrayBuffer());if(bytes.length<33)return blob;const type=new TextEncoder().encode('pHYs'),data=new Uint8Array(9),dv=new DataView(data.buffer);dv.setUint32(0,11811,false);dv.setUint32(4,11811,false);data[8]=1;const crcInput=new Uint8Array(13);crcInput.set(type,0);crcInput.set(data,4);const chunk=new Uint8Array(21),cdv=new DataView(chunk.buffer);setBe32(cdv,0,9);chunk.set(type,4);chunk.set(data,8);setBe32(cdv,17,crc32Png(crcInput));const insertAt=33,out=new Uint8Array(bytes.length+chunk.length);out.set(bytes.slice(0,insertAt),0);out.set(chunk,insertAt);out.set(bytes.slice(insertAt),insertAt+chunk.length);return new Blob([out],{type:'image/png'});
}
async function saveHighResSketch(){
  const p=getActiveProject(),pv=Number(p.selected_sketch_pv),row=current.schedule.find(r=>Number(r['PV Modules per Tracker'])===pv);if(!row)return;const filename=`${safeFilename(p.project_code)}_${safeFilename(p.project_name)}_Tracker_Sketch_${pv}PV.png`,location=await chooseSaveLocation(filename,'PNG image',{'image/png':['.png']});if(location.cancelled)return;
  const svg=buildSketchSvg(row,1200,700),blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=3600;canvas.height=2100;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);canvas.toBlob(async png=>{if(!png){showToast('Could not generate the sketch image.');return;}const dpi=await addPng300Dpi(png),result=await writeBlobToSaveLocation(dpi,filename,location);if(result.saved)showToast(result.picker?'High-resolution tracker sketch saved.':'High-resolution tracker sketch downloaded.');},'image/png');};img.onerror=()=>{URL.revokeObjectURL(url);showToast('Could not generate the sketch image.');};img.src=url;
}

function formatAnalysisNumber(value,maxDigits=2){
  const number=Number(value);if(!Number.isFinite(number))return '';
  return number.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:maxDigits});
}
function formatAnalysisFixed(value,digits=2){
  const number=Number(value);return (Number.isFinite(number)?number:0).toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits});
}
function buildSteelAnalysisData(){
  const p=getActiveProject();
  const priceRecords=normalizeAnalysisMaterialPrices(p?.analysis_material_prices);
  const steelRows=(current?.bom?.rows||[]).filter(row=>E.normalizeText(row.Category).includes('steelstructure'));
  const materials=[...new Set(steelRows.map(row=>String(row.Material??'').trim()).filter(material=>material&&material!=='-'))].sort((a,b)=>a.localeCompare(b));
  const requestedMaterial=String(p?.analysis_material_filter||'ALL');
  const selectedMaterial=requestedMaterial==='ALL'||materials.includes(requestedMaterial)?requestedMaterial:'ALL';
  const mappedRows=steelRows.map(row=>{
    const material=String(row.Material??'').trim();
    const quantity=Math.max(0,E.asNumber(row['Total Qty'],0));
    const rawWeight=row.Weight;
    const unitWeight=rawWeight!==''&&rawWeight!==null&&rawWeight!==undefined&&Number.isFinite(Number(rawWeight))&&Number(rawWeight)>=0?Number(rawWeight):null;
    const totalWeight=unitWeight===null?null:unitWeight*quantity;
    const priceRecord=priceRecords[material]||null;
    const calculatedCost=totalWeight!==null&&priceRecord?totalWeight*priceRecord.price_per_kg:null;
    return {source:row,material,quantity,unitWeight,totalWeight,priceRecord,calculatedCost};
  });
  const filteredRows=selectedMaterial==='ALL'?mappedRows:mappedRows.filter(item=>item.material===selectedMaterial);
  const sumWeight=rows=>rows.reduce((sum,item)=>sum+(item.totalWeight??0),0);
  const materialWeights={};for(const item of mappedRows)if(item.material)materialWeights[item.material]=(materialWeights[item.material]||0)+(item.totalWeight??0);
  const allCostByCurrency={};for(const item of mappedRows)if(item.calculatedCost!==null){const currency=item.priceRecord.currency;allCostByCurrency[currency]=(allCostByCurrency[currency]||0)+item.calculatedCost;}
  const costByCurrency={};for(const item of filteredRows)if(item.calculatedCost!==null){const currency=item.priceRecord.currency;costByCurrency[currency]=(costByCurrency[currency]||0)+item.calculatedCost;}
  const allUnpricedMaterials=[...new Set(mappedRows.filter(item=>item.totalWeight>0&&item.material&&!item.priceRecord).map(item=>item.material))].sort((a,b)=>a.localeCompare(b));
  const unpricedMaterials=[...new Set(filteredRows.filter(item=>item.totalWeight>0&&item.material&&!item.priceRecord).map(item=>item.material))].sort((a,b)=>a.localeCompare(b));
  const tableRows=filteredRows.map(item=>({
    'Part Name':item.source['Part Name']??item.source.Part??'',
    'TAG':item.source.TAG??'',
    'Material':item.material||'Not specified',
    'Unit Weight (kg)':item.unitWeight===null?'Missing':formatAnalysisNumber(item.unitWeight,3),
    'Total Qty':formatAnalysisNumber(item.quantity,3),
    'Total Weight (kg)':item.totalWeight===null?'Not calculated':formatAnalysisNumber(item.totalWeight,2),
    'Registered Price / kg':item.priceRecord?formatAnalysisNumber(item.priceRecord.price_per_kg,4):'Not registered',
    'Currency':item.priceRecord?.currency||'',
    'Calculated Cost':item.calculatedCost===null?'Not calculated':formatAnalysisFixed(item.calculatedCost,2),
  }));
  const registeredPriceRows=Object.values(priceRecords).sort((a,b)=>a.material.localeCompare(b.material)).map(record=>{
    const weight=materialWeights[record.material]||0;
    return {'Material':record.material,'Price / kg':formatAnalysisNumber(record.price_per_kg,4),'Currency':record.currency,'Current Weight (kg)':formatAnalysisNumber(weight,2),'Current Estimated Cost':`${formatAnalysisFixed(weight*record.price_per_kg,2)} ${record.currency}`};
  });
  const totalPowerKw=Math.max(0,E.asNumber(current?.kpis?.totalPower,0)*1000);
  return {
    materials,selectedMaterial,tableRows,priceRecords,registeredPriceRows,costByCurrency,allCostByCurrency,unpricedMaterials,allUnpricedMaterials,
    totalSteelWeight:sumWeight(mappedRows),
    filteredWeight:sumWeight(filteredRows),
    missingWeightCount:filteredRows.filter(item=>item.quantity>0&&item.unitWeight===null).length,
    allMissingWeightCount:mappedRows.filter(item=>item.quantity>0&&item.unitWeight===null).length,
    kgPerKw:totalPowerKw>0?sumWeight(mappedRows)/totalPowerKw:0,
  };
}
function analysisBackButtonHtml(){
  return `<button id="analysisBackBtn" class="analysis-back-button" type="button" aria-label="Back to Analysis home" title="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg></button>`;
}
function wireAnalysisBackButton(){
  document.getElementById('analysisBackBtn')?.addEventListener('click',()=>{uiState.analysisPage='home';renderAnalysis();requestAnimationFrame(updateFixedHorizontalScroll);});
}
function renderSteelAnalysis(){
  const root=document.getElementById('tabAnalysis'),p=getActiveProject();if(!root||!p)return;
  const data=buildSteelAnalysisData();
  if(p.analysis_material_filter!==data.selectedMaterial)p.analysis_material_filter=data.selectedMaterial;
  const filterLabel=data.selectedMaterial==='ALL'?'All materials':data.selectedMaterial;
  const priceMaterials=[...new Set([...data.materials,...Object.keys(data.priceRecords)])].sort((a,b)=>a.localeCompare(b));
  let editorMaterial=String(uiState.analysisPriceEditor[p.project_id]||'');if(!priceMaterials.includes(editorMaterial))editorMaterial='';
  const editorRecord=data.priceRecords[editorMaterial]||null;
  const totalCostEntries=Object.entries(data.costByCurrency).sort(([a],[b])=>a.localeCompare(b));
  const totalCostHtml=totalCostEntries.length?totalCostEntries.map(([currency,cost])=>`<span>${formatAnalysisFixed(cost,2)} ${currency}</span>`).join(''):'<span>0.00</span>';
  const selectedPrice=data.selectedMaterial==='ALL'?`${data.registeredPriceRows.length} material price(s) registered`:(data.priceRecords[data.selectedMaterial]?`${formatAnalysisNumber(data.priceRecords[data.selectedMaterial].price_per_kg,4)} ${data.priceRecords[data.selectedMaterial].currency} / kg`:'Not registered');
  const warnings=[];if(data.missingWeightCount)warnings.push(`${data.missingWeightCount} filtered steel-structure item(s) have no valid unit weight and are excluded from weight and cost totals.`);if(data.unpricedMaterials.length)warnings.push(`No price registered for: ${data.unpricedMaterials.join(', ')}. These materials are excluded from cost totals.`);
  const warningHtml=warnings.length?`<div class="analysis-warning">${warnings.map(message=>`<div>${escapeHtml(message)}</div>`).join('')}</div>`:'';
  root.innerHTML=`<div class="analysis-title-row"><div><h2 class="table-title">Steel Structure Weight and Cost Analysis</h2><p class="table-subtitle">Weight is calculated from Project BOM steel-structure rows: Unit Weight × Total Qty.</p></div><div class="analysis-ratio"><span>kg / kW</span><strong>${formatAnalysisFixed(data.kgPerKw,2)} kg/kW</strong></div></div><div class="analysis-controls analysis-filter-controls"><label for="analysisMaterial">Filter steel structure by material<select id="analysisMaterial"><option value="ALL" ${data.selectedMaterial==='ALL'?'selected':''}>All materials</option>${data.materials.map(material=>`<option value="${escapeHtml(material)}" ${material===data.selectedMaterial?'selected':''}>${escapeHtml(material)}</option>`).join('')}</select></label></div><div class="analysis-summary"><div class="analysis-card"><span>Total Steel Structure Weight</span><strong>${formatAnalysisNumber(data.totalSteelWeight,2)} kg</strong></div><div class="analysis-card"><span>Filtered Weight — ${escapeHtml(filterLabel)}</span><strong>${formatAnalysisNumber(data.filteredWeight,2)} kg</strong></div><div class="analysis-card"><span>Registered Price</span><strong>${escapeHtml(selectedPrice)}</strong></div><div class="analysis-card analysis-cost-card"><span>Total Cost</span><strong class="analysis-cost-lines">${totalCostHtml}</strong></div></div>${warningHtml}<h2 class="table-title analysis-detail-title">Material Price Register</h2><p class="table-subtitle">Select a material to add a price. Select an existing registration to update or delete it.</p><div class="analysis-controls analysis-price-controls"><label for="analysisPriceMaterial">Material<select id="analysisPriceMaterial"><option value="">Select material</option>${priceMaterials.map(material=>`<option value="${escapeHtml(material)}" ${material===editorMaterial?'selected':''}>${escapeHtml(material)}</option>`).join('')}</select></label><label for="analysisPrice">Price / kg<input id="analysisPrice" type="number" min="0" step="any" value="${editorRecord?escapeHtml(editorRecord.price_per_kg):''}" placeholder="Enter price per kg"></label><label for="analysisCurrency">Currency<select id="analysisCurrency">${ANALYSIS_CURRENCIES.map(([code,label])=>`<option value="${code}" ${code===(editorRecord?.currency||'USD')?'selected':''}>${escapeHtml(label)}</option>`).join('')}</select></label><div class="analysis-price-actions"><button id="analysisPriceAdd" ${!editorMaterial||editorRecord?'disabled':''}>Add</button><button id="analysisPriceUpdate" ${!editorRecord?'disabled':''}>Update</button><button id="analysisPriceDelete" class="danger" ${!editorRecord?'disabled':''}>Delete</button></div></div><div id="analysisPriceRegistry">${makeArrayTable(['Material','Price / kg','Currency','Current Weight (kg)','Current Estimated Cost'],data.registeredPriceRows)}</div><h2 class="table-title analysis-detail-title">Filtered Steel Structure Details</h2>${makeArrayTable(['Part Name','TAG','Material','Unit Weight (kg)','Total Qty','Total Weight (kg)','Registered Price / kg','Currency','Calculated Cost'],data.tableRows)}`;
  root.insertAdjacentHTML('afterbegin',`<div class="analysis-subpage-nav">${analysisBackButtonHtml()}</div>`);
  document.getElementById('analysisMaterial').addEventListener('change',e=>{p.analysis_material_filter=e.target.value;markDirty();renderAnalysis();requestAnimationFrame(updateFixedHorizontalScroll);});
  document.getElementById('analysisPriceMaterial').addEventListener('change',e=>{uiState.analysisPriceEditor[p.project_id]=e.target.value;renderAnalysis();});
  const readEditor=()=>{const material=document.getElementById('analysisPriceMaterial').value,rawPrice=document.getElementById('analysisPrice').value.trim(),price=Number(rawPrice),currency=document.getElementById('analysisCurrency').value;if(!material){showToast('Select a material first.');return null;}if(rawPrice===''||!Number.isFinite(price)||price<0){showToast('Enter a valid price per kg.');return null;}return {material,price_per_kg:price,currency:isAnalysisCurrency(currency)?currency:'USD'};};
  document.getElementById('analysisPriceAdd').addEventListener('click',()=>{const record=readEditor();if(!record)return;if(p.analysis_material_prices[record.material]){showToast('This material already has a registered price. Use Update.');return;}p.analysis_material_prices[record.material]=record;markDirty();renderAnalysis();showToast(`Price added for ${record.material}.`);});
  document.getElementById('analysisPriceUpdate').addEventListener('click',()=>{const record=readEditor();if(!record||!p.analysis_material_prices[record.material])return;p.analysis_material_prices[record.material]=record;markDirty();renderAnalysis();showToast(`Price updated for ${record.material}.`);});
  document.getElementById('analysisPriceDelete').addEventListener('click',()=>{const material=document.getElementById('analysisPriceMaterial').value;if(!material||!p.analysis_material_prices[material])return;if(!confirm(`Delete the registered price for ${material}?`))return;delete p.analysis_material_prices[material];markDirty();renderAnalysis();showToast(`Price deleted for ${material}.`);});
  root.querySelectorAll('#analysisPriceRegistry tbody tr').forEach((row,index)=>{const material=data.registeredPriceRows[index]?.Material;if(material===editorMaterial)row.classList.add('row-selected');row.addEventListener('click',()=>{uiState.analysisPriceEditor[p.project_id]=material;renderAnalysis();});});
  wireAnalysisBackButton();
}

const ANALYSIS_ITEM_PAGE_CONFIG=Object.freeze({
  electrical:{title:'Electrical Cost',subtitle:'Unit-price analysis for electrical and control-system items in the Project BOM.'},
  major:{title:'Major Components Cost',subtitle:'Unit-price analysis for Bearings, Slew Drives, and PV Modules.'},
  fasteners:{title:'Fasteners Cost',subtitle:'Unit-price analysis for all Project BOM fasteners, including the selected contingency.'},
});
function analysisCategoryMatches(page,row){
  const category=E.normalizeText(row?.Category);
  if(page==='electrical')return category.includes('electrical');
  if(page==='major')return !category.includes('fastener')&&(category.startsWith('bearings')||category.startsWith('slewdrive')||category.startsWith('pvmodule'));
  if(page==='fasteners')return category.includes('fastener');
  return false;
}
function analysisItemKey(row){
  return String(row?._bom_key||`item:${E.normalizeText(row?.TAG||row?.['Part Name']||row?.Part||row?.Description)}`);
}
function mergeAnalysisCurrencyTotals(target,source){
  for(const [currency,value] of Object.entries(source||{}))target[currency]=(target[currency]||0)+E.asNumber(value,0);return target;
}
function analysisCurrencyText(totals,empty='0.00'){
  const entries=Object.entries(totals||{}).filter(([,value])=>Number.isFinite(Number(value))&&Number(value)!==0).sort(([a],[b])=>a.localeCompare(b));
  return entries.length?entries.map(([currency,value])=>`${formatAnalysisFixed(value,2)} ${currency}`).join(' | '):empty;
}
function analysisCurrencyHtml(totals,empty='0.00'){
  const entries=Object.entries(totals||{}).filter(([,value])=>Number.isFinite(Number(value))&&Number(value)!==0).sort(([a],[b])=>a.localeCompare(b));
  return entries.length?entries.map(([currency,value])=>`<span>${formatAnalysisFixed(value,2)} ${escapeHtml(currency)}</span>`).join(''):`<span>${escapeHtml(empty)}</span>`;
}
function buildItemCostData(page){
  const p=getActiveProject(),priceRecords=normalizeAnalysisItemPrices(p?.analysis_item_prices),sourceRows=(current?.bom?.rows||[]).filter(row=>analysisCategoryMatches(page,row));
  const mappedRows=sourceRows.map(row=>{
    const key=analysisItemKey(row),quantity=Math.max(0,E.asNumber(row['Total Qty'],0)),priceRecord=priceRecords[key]||null,calculatedCost=priceRecord?quantity*priceRecord.price_per_unit:null;
    return {key,source:row,quantity,priceRecord,calculatedCost,label:String(row['Part Name']??row.Part??row.Description??key)};
  });
  const costByCurrency={};for(const item of mappedRows)if(item.calculatedCost!==null){const currency=item.priceRecord.currency;costByCurrency[currency]=(costByCurrency[currency]||0)+item.calculatedCost;}
  const tableRows=mappedRows.map(item=>({'Part Name':item.label,'TAG':item.source.TAG??'','Category':item.source.Category??'','Unit':item.source.Unit??'','Total Qty':formatAnalysisNumber(item.quantity,3),'Price / Unit':item.priceRecord?formatAnalysisNumber(item.priceRecord.price_per_unit,4):'Not registered','Currency':item.priceRecord?.currency||'','Calculated Cost':item.calculatedCost===null?'Not calculated':formatAnalysisFixed(item.calculatedCost,2)}));
  const registeredItems=mappedRows.filter(item=>item.priceRecord);
  const registeredPriceRows=registeredItems.map(item=>({'Part Name':item.label,'TAG':item.source.TAG??'','Price / Unit':formatAnalysisNumber(item.priceRecord.price_per_unit,4),'Currency':item.priceRecord.currency,'Current Qty':formatAnalysisNumber(item.quantity,3),'Current Cost':`${formatAnalysisFixed(item.calculatedCost,2)} ${item.priceRecord.currency}`}));
  return {mappedRows,tableRows,registeredItems,registeredPriceRows,costByCurrency,pricedCount:registeredItems.filter(item=>item.quantity>0).length,unpricedCount:mappedRows.filter(item=>item.quantity>0&&!item.priceRecord).length};
}
function renderItemCostAnalysis(page){
  const root=document.getElementById('tabAnalysis'),p=getActiveProject(),config=ANALYSIS_ITEM_PAGE_CONFIG[page],data=buildItemCostData(page);if(!root||!p||!config)return;
  const editorByPage=uiState.analysisItemPriceEditor[p.project_id]||(uiState.analysisItemPriceEditor[p.project_id]={});let editorKey=String(editorByPage[page]||'');if(!data.mappedRows.some(item=>item.key===editorKey))editorKey='';
  const editorItem=data.mappedRows.find(item=>item.key===editorKey)||null,editorRecord=editorItem?.priceRecord||null;
  const options=data.mappedRows.map(item=>`<option value="${escapeHtml(item.key)}" ${item.key===editorKey?'selected':''}>${escapeHtml(item.label)}${item.source.TAG?` — ${escapeHtml(item.source.TAG)}`:''}</option>`).join('');
  const warningHtml=data.unpricedCount?`<div class="analysis-warning">${data.unpricedCount} item(s) with a positive quantity have no unit price and are excluded from the cost total.</div>`:'';
  root.innerHTML=`<div class="analysis-subpage-nav">${analysisBackButtonHtml()}</div><div class="analysis-title-row"><div><h2 class="table-title">${escapeHtml(config.title)}</h2><p class="table-subtitle">${escapeHtml(config.subtitle)}</p></div></div><div class="analysis-summary"><div class="analysis-card"><span>Items in Current BOM</span><strong>${data.mappedRows.length}</strong></div><div class="analysis-card"><span>Priced Items</span><strong>${data.pricedCount}</strong></div><div class="analysis-card"><span>Unpriced Items</span><strong>${data.unpricedCount}</strong></div><div class="analysis-card analysis-cost-card"><span>Total Cost</span><strong class="analysis-cost-lines">${analysisCurrencyHtml(data.costByCurrency)}</strong></div></div>${warningHtml}<h2 class="table-title analysis-detail-title">Unit Price Register</h2><p class="table-subtitle">Select a current BOM item to add or update its unit price.</p><div class="analysis-controls analysis-price-controls"><label for="analysisItemPricePart">BOM Item<select id="analysisItemPricePart"><option value="">Select item</option>${options}</select></label><label for="analysisItemUnitPrice">Price / Unit<input id="analysisItemUnitPrice" type="number" min="0" step="any" value="${editorRecord?escapeHtml(editorRecord.price_per_unit):''}" placeholder="Enter price per unit"></label><label for="analysisItemCurrency">Currency<select id="analysisItemCurrency">${ANALYSIS_CURRENCIES.map(([code,label])=>`<option value="${code}" ${code===(editorRecord?.currency||'USD')?'selected':''}>${escapeHtml(label)}</option>`).join('')}</select></label><div class="analysis-price-actions"><button id="analysisItemPriceAdd" ${!editorItem||editorRecord?'disabled':''}>Add</button><button id="analysisItemPriceUpdate" ${!editorRecord?'disabled':''}>Update</button><button id="analysisItemPriceDelete" class="danger" ${!editorRecord?'disabled':''}>Delete</button></div></div><div id="analysisItemPriceRegistry">${makeArrayTable(['Part Name','TAG','Price / Unit','Currency','Current Qty','Current Cost'],data.registeredPriceRows)}</div><h2 class="table-title analysis-detail-title">${escapeHtml(config.title)} Details</h2>${makeArrayTable(['Part Name','TAG','Category','Unit','Total Qty','Price / Unit','Currency','Calculated Cost'],data.tableRows)}`;
  wireAnalysisBackButton();
  document.getElementById('analysisItemPricePart').addEventListener('change',e=>{editorByPage[page]=e.target.value;renderAnalysis();});
  const readEditor=()=>{const key=document.getElementById('analysisItemPricePart').value,rawPrice=document.getElementById('analysisItemUnitPrice').value.trim(),price=Number(rawPrice),currency=document.getElementById('analysisItemCurrency').value;if(!key){showToast('Select a BOM item first.');return null;}if(rawPrice===''||!Number.isFinite(price)||price<0){showToast('Enter a valid unit price.');return null;}return {key,record:{price_per_unit:price,currency:isAnalysisCurrency(currency)?currency:'USD'}};};
  document.getElementById('analysisItemPriceAdd').addEventListener('click',()=>{const value=readEditor();if(!value)return;p.analysis_item_prices=p.analysis_item_prices||{};if(p.analysis_item_prices[value.key]){showToast('This item already has a registered price. Use Update.');return;}p.analysis_item_prices[value.key]=value.record;markDirty();renderAnalysis();showToast('Unit price added.');});
  document.getElementById('analysisItemPriceUpdate').addEventListener('click',()=>{const value=readEditor();if(!value)return;p.analysis_item_prices=p.analysis_item_prices||{};p.analysis_item_prices[value.key]=value.record;markDirty();renderAnalysis();showToast('Unit price updated.');});
  document.getElementById('analysisItemPriceDelete').addEventListener('click',()=>{const key=document.getElementById('analysisItemPricePart').value;if(!key||!p.analysis_item_prices?.[key])return;if(!confirm('Delete the registered unit price for this item?'))return;delete p.analysis_item_prices[key];markDirty();renderAnalysis();showToast('Unit price deleted.');});
  root.querySelectorAll('#analysisItemPriceRegistry tbody tr').forEach((row,index)=>{const item=data.registeredItems[index];if(item?.key===editorKey)row.classList.add('row-selected');row.addEventListener('click',()=>{editorByPage[page]=item.key;renderAnalysis();});});
}
function buildTotalCostData(){
  const steel=buildSteelAnalysisData(),electrical=buildItemCostData('electrical'),major=buildItemCostData('major'),fasteners=buildItemCostData('fasteners');
  const sections=[
    {name:'Steel Structure',totals:steel.allCostByCurrency,status:`${steel.allUnpricedMaterials.length} unpriced material(s); ${steel.allMissingWeightCount} item(s) missing weight`},
    {name:'Electrical',totals:electrical.costByCurrency,status:`${electrical.pricedCount} priced / ${electrical.unpricedCount} unpriced`},
    {name:'Major Components',totals:major.costByCurrency,status:`${major.pricedCount} priced / ${major.unpricedCount} unpriced`},
    {name:'Fasteners',totals:fasteners.costByCurrency,status:`${fasteners.pricedCount} priced / ${fasteners.unpricedCount} unpriced`},
  ];
  const grandTotals={};sections.forEach(section=>mergeAnalysisCurrencyTotals(grandTotals,section.totals));
  const gapCount=steel.allUnpricedMaterials.length+steel.allMissingWeightCount+electrical.unpricedCount+major.unpricedCount+fasteners.unpricedCount;
  return {sections,grandTotals,gapCount,rows:sections.map(section=>({Category:section.name,'Estimated Cost':analysisCurrencyText(section.totals),'Pricing Status':section.status}))};
}
function renderTotalCostAnalysis(){
  const root=document.getElementById('tabAnalysis'),data=buildTotalCostData();if(!root)return;const currencies=Object.keys(data.grandTotals).length;
  const warningHtml=data.gapCount?`<div class="analysis-warning">${data.gapCount} pricing or weight data gap(s) remain. Total Cost includes only rows with enough information to calculate a cost.</div>`:'';
  root.innerHTML=`<div class="analysis-subpage-nav">${analysisBackButtonHtml()}</div><div class="analysis-title-row"><div><h2 class="table-title">Total Project Cost</h2><p class="table-subtitle">Combined Steel Structure, Electrical, Major Components, and Fasteners costs for the active project.</p></div></div><div class="analysis-summary analysis-total-summary"><div class="analysis-card analysis-cost-card"><span>Calculated Project Total</span><strong class="analysis-cost-lines">${analysisCurrencyHtml(data.grandTotals)}</strong></div><div class="analysis-card"><span>Cost Categories</span><strong>${data.sections.length}</strong></div><div class="analysis-card"><span>Currencies in Total</span><strong>${currencies}</strong></div><div class="analysis-card"><span>Data Gaps</span><strong>${data.gapCount}</strong></div></div>${warningHtml}<h2 class="table-title analysis-detail-title">Cost Breakdown</h2><p class="table-subtitle">Different currencies are shown separately and are never added together without an exchange rate.</p>${makeArrayTable(['Category','Estimated Cost','Pricing Status'],data.rows)}`;
  wireAnalysisBackButton();
}
function analysisFindPackagePart(item){
  const candidates=[...(current?.bom?.rows||[]),...(partMaster||[])],tag=E.normalizeText(item.tag),match=E.normalizeText(item.match||item.label||item.tag);
  let source=tag?candidates.find(row=>E.normalizeText(row.TAG)===tag):null;if(!source&&match)source=candidates.find(row=>E.normalizeText([row['Part Name']??row.Part,row.TAG,row.Description,row['Part Number']].join(' ')).includes(match));
  return {name:String(source?.['Part Name']??source?.Part??item.label??item.tag??'Fastener'),tag:String(source?.TAG??item.tag??''),description:String(source?.Description??'')};
}
function buildFastenerPackagingData(){
  const active=current?.active||[],totalTrackers=active.reduce((sum,row)=>sum+E.asInt(row['Number of Trackers']),0),bearingPackages=active.reduce((sum,row)=>sum+E.asInt(row['Bearing Posts / Tracker'])*E.asInt(row['Number of Trackers']),0),hatRailPackages=active.reduce((sum,row)=>sum+Math.max(E.asInt(row['PV Modules per Tracker'])-2,0)*E.asInt(row['Number of Trackers']),0),zRailPackages=4*totalTrackers;
  const definitions=[
    {title:'Slew Drive Seat to Main Post',basis:'One package per tracker',packages:totalTrackers,items:[['k001164',8],['k001010',8],['k001154',16],['k001163',8]]},
    {title:'Slew Drive to Slew Drive Seat',basis:'One package per tracker',packages:totalTrackers,items:[['k001231',4],['k001228',4],['k001238',4],['k001230',4],[null,2,'din7967m18','DIN 7967 - M18'],[null,2,'din936iso4035m18','DIN 936 ISO 4035 - M18'],['k001239',4]]},
    {title:'Bearing Adapter to Bearing Post',basis:'One package per bearing adapter',packages:bearingPackages,items:[['k001125',4],['k001124',4],['k001130',4],['k001123',4]]},
    {title:'Bearing to Bearing Adapter',basis:'One package per bearing',packages:bearingPackages,items:[['k001129',2],['k001137',2]]},
    {title:'Main Beam to Slew Drive',basis:'One package per tracker',packages:totalTrackers,items:[['k001385',16],['k001127',22],['k001166',16]]},
    {title:'Main Beam to Main Beam',basis:'One package per tracker',packages:totalTrackers,items:[['k001388',16],['k001157',32],['k001013',16],['k001479',32]]},
    {title:'Hat Rail to Main Beam',basis:'One package per Hat rail',packages:hatRailPackages,items:[['k001576',2],['k001575',2],['k001074',2]]},
    {title:'Z Rail to Main Beam',basis:'One package per Z rail',packages:zRailPackages,items:[['k001151',2],['k001235',2],['k001074',2]]},
  ];
  return definitions.map(definition=>{const rows=definition.items.map(([tag,qty,match,label])=>{const part=analysisFindPackagePart({tag,match,label});return {'Part Name':part.name,'TAG':part.tag,'Description':part.description,'Qty / Package':qty,'Packages':definition.packages,'Required Qty':qty*definition.packages};});return {...definition,rows};});
}
function renderFastenerPackaging(){
  const root=document.getElementById('tabAnalysis'),sections=buildFastenerPackagingData();if(!root)return;const totalPackages=sections.reduce((sum,section)=>sum+section.packages,0);
  root.innerHTML=`<div class="analysis-subpage-nav">${analysisBackButtonHtml()}</div><div class="analysis-title-row"><div><h2 class="table-title">Fastener Packaging</h2><p class="table-subtitle">Installation kits grouped by connection point. Quantities are derived from the active project configuration.</p></div></div><div class="analysis-summary"><div class="analysis-card"><span>Installation Sections</span><strong>${sections.length}</strong></div><div class="analysis-card"><span>Total Section Packages</span><strong>${formatAnalysisNumber(totalPackages,0)}</strong></div><div class="analysis-card analysis-packaging-note"><span>Contingency Handling</span><strong>Project BOM</strong></div></div><div class="analysis-warning analysis-info">Packaging shows installation-required quantities. Any fastener contingency remains visible in the Project BOM and is not divided into installation packages.</div><div class="analysis-package-grid">${sections.map((section,index)=>`<section class="analysis-package-section"><div class="analysis-package-header"><div><span>Installation Section ${index+1}</span><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.basis)}</p></div><strong>${formatAnalysisNumber(section.packages,0)} package(s)</strong></div>${makeArrayTable(['Part Name','TAG','Description','Qty / Package','Packages','Required Qty'],section.rows)}</section>`).join('')}</div>`;
  wireAnalysisBackButton();
}
function analysisHomeIcon(page){
  const paths={steel:'<path d="M4 6h16M6 6v12m12-12v12M4 18h16M8 10h8m-8 4h8"/>',electrical:'<path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z"/>',major:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',fasteners:'<path d="m8 3 3 3-5 5-3-3 5-5Zm8 10 5 5-3 3-5-5m-5-5 5 5m-2-8 5 5"/>',total:'<path d="M6 5h12M8 9l-3 3 3 3m8-6 3 3-3 3M6 19h12"/>',packaging:'<path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7m-9 4v10"/>'};
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[page]||paths.total}</svg>`;
}
function analysisHomeSummary(totals,hasGaps=false){
  const text=analysisCurrencyText(totals,'');return text|| (hasGaps?'Prices required':'0.00');
}
function renderAnalysisHome(){
  const root=document.getElementById('tabAnalysis');if(!root)return;const steel=buildSteelAnalysisData(),electrical=buildItemCostData('electrical'),major=buildItemCostData('major'),fasteners=buildItemCostData('fasteners'),total=buildTotalCostData(),packages=buildFastenerPackagingData();
  const cards=[
    {page:'steel',title:'Steel Structure Cost',description:'Weight, material prices, and kg/kW.',summary:analysisHomeSummary(steel.allCostByCurrency,steel.allUnpricedMaterials.length>0||steel.allMissingWeightCount>0)},
    {page:'electrical',title:'Electrical Cost',description:'Electrical and control-system equipment.',summary:analysisHomeSummary(electrical.costByCurrency,electrical.unpricedCount>0)},
    {page:'major',title:'Major Components Cost',description:'Bearings, Slew Drives, and PV Modules.',summary:analysisHomeSummary(major.costByCurrency,major.unpricedCount>0)},
    {page:'fasteners',title:'Fasteners Cost',description:'All fasteners with BOM contingency.',summary:analysisHomeSummary(fasteners.costByCurrency,fasteners.unpricedCount>0)},
    {page:'total',title:'Total Project Cost',description:'Combined cost breakdown by currency.',summary:analysisHomeSummary(total.grandTotals,total.gapCount>0)},
    {page:'packaging',title:'Fastener Packaging',description:'Installation kits for eight connection sections.',summary:`${packages.length} installation sections`},
  ];
  root.innerHTML=`<div class="analysis-home-header"><h2 class="table-title">Project Cost Analysis</h2><p class="table-subtitle">Choose an analysis area for the active project.</p></div><div class="analysis-home-grid">${cards.map(card=>`<button class="analysis-home-card" type="button" data-analysis-page="${card.page}"><span class="analysis-home-icon">${analysisHomeIcon(card.page)}</span><span class="analysis-home-copy"><strong>${escapeHtml(card.title)}</strong><span>${escapeHtml(card.description)}</span><em>${escapeHtml(card.summary)}</em></span><span class="analysis-home-arrow" aria-hidden="true">›</span></button>`).join('')}</div>`;
  root.querySelectorAll('[data-analysis-page]').forEach(button=>button.addEventListener('click',()=>{uiState.analysisPage=button.dataset.analysisPage;renderAnalysis();requestAnimationFrame(updateFixedHorizontalScroll);}));
}
function renderAnalysis(){
  const page=String(uiState.analysisPage||'home');
  if(page==='steel')renderSteelAnalysis();else if(ANALYSIS_ITEM_PAGE_CONFIG[page])renderItemCostAnalysis(page);else if(page==='total')renderTotalCostAnalysis();else if(page==='packaging')renderFastenerPackaging();else{uiState.analysisPage='home';renderAnalysisHome();}
}

function projectSummaryRows(p,calc){
  return [['Field','Value'],['Project Name',p.project_name],['Project Code',p.project_code],['Foundation Type',p.inputs.foundation_type],['CAD Blocks Availability',p.inputs.cad_blocks_available],['BOM Mode',E.getBomModeText(p)],['SOLTRK Version',`SOLTRK ${E.normalizeSoltrkVersion(p.soltrk_version)}`],['Max Span Length',p.inputs.max_span_length],['PV Module Power (Wp)',p.inputs.pv_power],['Export Date/Time',formatDateTime()],['Total Trackers',calc.kpis.totalTrackers],['Total PV Modules',calc.kpis.totalModules],['Plant Power (MWp)',Number(calc.kpis.totalPower.toFixed(3))],['BOM Line Items',calc.bom.rows.length]];
}
function inputExportRows(p){const i=p.inputs;return [['Input','Value'],['Project Name',p.project_name],['Project Code',p.project_code],['CAD Blocks Availability',i.cad_blocks_available],['BOM Mode',E.getBomModeText(p)],['SOLTRK Version',`SOLTRK ${E.normalizeSoltrkVersion(p.soltrk_version)}`],['Max Span Length',i.max_span_length],['PV Module Width',i.pv_module_width],['PV Module Length',i.pv_module_length],['PV Module Transverse Hole Distance',i.pv_module_hole_distance],['PV Module Longitudinal Hole Distance 1',i.pv_module_longitudinal_hole_distance_1],['PV Module Longitudinal Hole Distance 2',i.pv_module_longitudinal_hole_distance_2],['PV Module Longitudinal Hole Distance 3',i.pv_module_longitudinal_hole_distance_3],['Hat Rail Hole Distance',i.hat_rail_hole_distance],['Z Rail Design Offset',i.z_rail_offset],['PV Module Gap',i.pv_module_gap],['PV Module Gap Locked',i.pv_gap_locked?'Yes':'No'],['PV Module Gap Formula','PV Module Transverse Hole Distance + Hat Rail Hole Distance - PV Module Width'],['Motor Gap',i.motor_gap],['Target End Gap',i.target_end_gap],['Overlap A/B',i.overlap_ab],['Overlap B/C',i.overlap_bc],['Main Beam A Length',i.main_beam_a_length],['Slew Drive Connection Length',i.main_beam_connection_length],['Main Beam B Length',i.main_beam_b_length],['Main Beam C Short Length',i.main_beam_c_short_length],['Main Beam C Long Length',i.main_beam_c_long_length],['Mid Plane to Beginning of Main Beam A / Connection',i.mid_plane_to_beam_a]];}
function customBearingExportRows(p,calc){
  if(E.cadBlocksAreAvailable(p)){
    const rows=[['Array Type','Mode','Posts / Pairs','North / Pair Distances','South Distances','Lock']];for(const pv of Object.keys(p.bearing_rules).sort((a,b)=>Number(a)-Number(b)))rows.push(ruleToTableValues(Number(pv),p.bearing_rules[pv]));return rows;
  }
  const rows=[['Array Type','Mode','Max Span Length (mm)','Tracker Length (mm)','Tracker Type','Bearing Posts']];for(const r of calc.schedule)rows.push([`${r['PV Modules per Tracker']}-PV`,'Symmetrical',E.niceNumber(E.asNumber(p.inputs.max_span_length,7900)),E.niceNumber(r['Tracker Length (mm)']),r['Span Type'],r['Bearing Posts / Tracker']]);return rows;
}
function buildProjectExport(p){
  const calc=E.calculateProject(p,partMaster,partMasterColumns);const arrays=[SELECTED_ARRAY_COLUMNS,...calc.active.map(r=>SELECTED_ARRAY_COLUMNS.map(c=>r[c]??''))];const bomColumns=calc.bom.columns.filter(c=>!['note','notes','calculationnote'].includes(E.normalizeText(c)));const bom=[bomColumns,...calc.bom.rows.map(r=>bomColumns.map(c=>r[c]??''))];const sheets=[{name:'Project Summary',rows:projectSummaryRows(p,calc)},{name:'Inputs',rows:inputExportRows(p)},{name:'Custom Bearing Rules',rows:customBearingExportRows(p,calc)},{name:'Selected Arrays',rows:arrays},{name:'Project BOM',rows:bom}];return {blob:XlsxLite.createWorkbookBlob(sheets),filename:`${safeFilename(p.project_code)}_${safeFilename(p.project_name)}_LUMA_Complete_BOM.xlsx`};
}
async function exportProject(p,directoryHandle=null){
  const file=buildProjectExport(p);if(directoryHandle){await saveBlobToDirectory(file.blob,file.filename,directoryHandle);return {saved:true,picker:true};}
  return saveBlobWithLocation(file.blob,file.filename,'Excel workbook',{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx']});
}
async function exportActive(){const p=getActiveProject();if(!p)return;const result=await exportProject(p);if(result.saved)showToast(result.picker?'Excel BOM saved.':'Excel BOM downloaded.');}
function exportAllDialog(){
  const projects=Object.values(workspace.projects);const html=`<p>Select the projects to export. One Excel workbook will be downloaded for each selected project.</p><div class="project-check-list">${projects.map(p=>`<label><input type="checkbox" data-export-project="${escapeHtml(p.project_id)}" checked> ${escapeHtml(p.project_code)} — ${escapeHtml(p.project_name)}</label>`).join('')}</div>`;
  openModal('Export Projects',html,[{text:'Cancel',onClick:closeModal},{text:'Export Selected',className:'export',onClick:async()=>{const ids=[...document.querySelectorAll('[data-export-project]:checked')].map(x=>x.dataset.exportProject);if(!ids.length){showToast('Select at least one project.');return;}closeModal();
    if(typeof window.showDirectoryPicker==='function'){
      try{const directory=await window.showDirectoryPicker({mode:'readwrite'});for(const id of ids)await exportProject(workspace.projects[id],directory);showToast(`${ids.length} Excel workbook(s) saved.`);return;}catch(err){if(err?.name==='AbortError')return;console.warn('The folder picker is unavailable; using browser downloads instead.',err);}
    }
    ids.forEach((id,index)=>setTimeout(()=>{const file=buildProjectExport(workspace.projects[id]);downloadBlob(file.blob,file.filename);},index*350));showToast(`${ids.length} Excel workbook(s) downloaded.`);
  }}]);
}
function showChangelog(){
  const versions=Object.keys(CHANGELOG);const latest=versions[versions.length-1];const html=`<div class="modal-form-row"><label>Version:</label><select id="changelogVersion">${versions.map(v=>`<option ${v===latest?'selected':''}>${v}</option>`).join('')}</select></div><div id="changelogDate" style="margin-bottom:8px"></div><div id="changelogText" class="changelog-text"></div>`;openModal(`${APP_NAME} Changelog`,html,[{text:'Close',onClick:closeModal}]);const refresh=()=>{const v=document.getElementById('changelogVersion').value;document.getElementById('changelogDate').textContent=`Date: ${CHANGELOG_DATES[v]||''}`;document.getElementById('changelogText').textContent=`Version ${v}\n${'='.repeat(40)}\n\n${(CHANGELOG[v]||[]).map(x=>`• ${x}`).join('\n')}`;};document.getElementById('changelogVersion').addEventListener('change',refresh);refresh();
}
function renderOutputTabsExceptInputs(){
  if(!current)return;renderArrayTable();renderSelectedArrays();renderBearingLayout();renderSupport();renderBom();renderPartMaster();renderSketch();renderAnalysis();renderLogic();renderBearingSummaryOnly();requestAnimationFrame(()=>requestAnimationFrame(updateFixedHorizontalScroll));
}
function refreshOutputsOnly(){
  recalculate();updateHeaderAndKpis();refreshProjectList();renderOutputTabsExceptInputs();saveRecovery();
}
function renderAll(rebuildInputs=false){
  recalculate();renderTabs();refreshProjectList();updateWorkspaceName();updateHeaderAndKpis();if(rebuildInputs||!document.getElementById('tabInputs').children.length)renderInputsTab();renderOutputTabsExceptInputs();requestAnimationFrame(()=>requestAnimationFrame(updateFixedHorizontalScroll));
}
function getHorizontalScrollParts(){
  const main=document.getElementById('mainContent');const active=document.querySelector('.tab-page.active');let target=null,maxOverflow=0;if(active){for(const el of active.querySelectorAll('.table-wrap,.sketch-box')){const over=Math.max(0,el.scrollWidth-el.clientWidth);if(over>maxOverflow){maxOverflow=over;target=el;}}}return {main,target,mainOverflow:Math.max(0,main.scrollWidth-main.clientWidth),targetOverflow:maxOverflow};
}
function updateFixedHorizontalScroll(){
  const bar=document.getElementById('fixedHorizontalScroll'),inner=document.getElementById('fixedHorizontalScrollInner');if(!bar||!inner)return;const parts=getHorizontalScrollParts();fixedScrollTarget=parts;const total=parts.mainOverflow+parts.targetOverflow;if(total<=1){bar.classList.remove('visible');bar.scrollLeft=0;return;}bar.classList.add('visible');inner.style.width=`${bar.clientWidth+total}px`;syncFixedBarFromTargets();
}
function syncFixedBarFromTargets(){
  if(!fixedScrollTarget||fixedScrollSyncing)return;fixedScrollSyncing=true;const {main,target,mainOverflow}=fixedScrollTarget;const bar=document.getElementById('fixedHorizontalScroll');bar.scrollLeft=Math.min(main.scrollLeft,mainOverflow)+(target?target.scrollLeft:0);fixedScrollSyncing=false;
}

function onFixedScroll(){
  if(!fixedScrollTarget||fixedScrollSyncing)return;fixedScrollSyncing=true;const bar=document.getElementById('fixedHorizontalScroll'),{main,target,mainOverflow}=fixedScrollTarget;const pos=bar.scrollLeft;main.scrollLeft=Math.min(pos,mainOverflow);if(target)target.scrollLeft=Math.max(0,pos-mainOverflow);fixedScrollSyncing=false;
}
function attachScrollSyncListeners(){
  document.getElementById('fixedHorizontalScroll').addEventListener('scroll',onFixedScroll);document.getElementById('mainContent').addEventListener('scroll',()=>{if(!fixedScrollSyncing)syncFixedBarFromTargets();});document.addEventListener('scroll',e=>{if(e.target?.classList?.contains('table-wrap')||e.target?.classList?.contains('sketch-box')){if(!fixedScrollSyncing)syncFixedBarFromTargets();}},true);window.addEventListener('resize',()=>requestAnimationFrame(updateFixedHorizontalScroll));
}
function handleWorkspaceFile(file){
  if(!file)return;const reader=new FileReader();reader.onload=()=>{try{loadWorkspacePayload(JSON.parse(reader.result));showToast('Workspace loaded.');}catch(err){alert(`Could not open workspace:\n${err.message}`);}};reader.readAsText(file);
}
function handlePartMasterFile(file){
  if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const payload=JSON.parse(reader.result),rows=payload.rows;if(!Array.isArray(rows)||!rows.length)throw new Error('The selected Part Master list is empty or invalid.');partMasterColumns=Array.isArray(payload.columns)&&payload.columns.length?[...payload.columns]:[...INTERNAL_PART_MASTER_COLUMNS];partMaster=rows.map(r=>{const out={};for(const c of partMasterColumns)out[c]=r[c]??'';return out;}).filter(r=>r.Part||r.TAG||r.Description);if(!partMaster.length)throw new Error('No valid Part Master rows found.');currentPartMasterListName=String(payload.name||file.name.replace(/\.json$/i,''));workspaceStructureDirty=true;Object.values(workspace.projects).forEach(p=>p.is_dirty=true);selectedPartMasterRows.clear();recalculate();renderAll(false);saveRecovery();showToast('Part Master loaded.');}catch(err){alert(`Could not load Part Master list:\n${err.message}`);}};reader.readAsText(file);
}
function initEvents(){
  document.getElementById('modalCloseBtn').addEventListener('click',closeModal);document.getElementById('modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal();});
  document.getElementById('newWorkspaceBtn').addEventListener('click',newWorkspace);document.getElementById('openWorkspaceBtn').addEventListener('click',openWorkspace);document.getElementById('renameWorkspaceBtn').addEventListener('click',renameWorkspace);document.getElementById('saveWorkspaceBtn').addEventListener('click',saveWorkspace);
  document.getElementById('newProjectBtn').addEventListener('click',newProject);document.getElementById('duplicateProjectBtn').addEventListener('click',duplicateProject);document.getElementById('renameProjectBtn').addEventListener('click',renameProject);document.getElementById('deleteProjectBtn').addEventListener('click',deleteProject);document.getElementById('resetProjectBtn').addEventListener('click',resetCurrentProject);
  document.getElementById('projectSearch').addEventListener('input',refreshProjectList);document.getElementById('projectList').addEventListener('change',e=>selectProject(e.target.value));
  document.getElementById('exportActiveBtn').addEventListener('click',exportActive);document.getElementById('exportAllBtn').addEventListener('click',exportAllDialog);document.getElementById('changelogBtn').addEventListener('click',showChangelog);
  document.getElementById('workspaceFileInput').addEventListener('change',e=>{handleWorkspaceFile(e.target.files[0]);e.target.value='';});document.getElementById('partMasterFileInput').addEventListener('change',e=>{handlePartMasterFile(e.target.files[0]);e.target.value='';});
  attachScrollSyncListeners();document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey))return;const key=e.key.toLowerCase();if(key==='s'){e.preventDefault();saveWorkspace();}else if(key==='n'){e.preventDefault();newProject();}else if(key==='d'){e.preventDefault();duplicateProject();}else if(key==='o'){e.preventDefault();openWorkspace();}});
}
function initApp(){
  initEvents();let loaded=false;const recoveryKey=storageGet(RECOVERY_KEY)?RECOVERY_KEY:(storageGet(LEGACY_RECOVERY_KEY)?LEGACY_RECOVERY_KEY:RECOVERY_KEY);try{const recovery=storageGet(recoveryKey);if(recovery){const recover=confirm('An unsaved recovery workspace was found.\n\nChoose OK to recover it, or Cancel to start with a new default workspace.');if(recover){loadWorkspacePayload(JSON.parse(recovery),true);if(recoveryKey===LEGACY_RECOVERY_KEY)storageRemove(LEGACY_RECOVERY_KEY);loaded=true;}else storageRemove(recoveryKey);}}catch{storageRemove(recoveryKey);}
  if(!loaded){workspace=makeDefaultWorkspace();partMasterColumns=[...workspace.shared_part_master.columns];partMaster=clone(workspace.shared_part_master.rows);currentPartMasterListName=workspace.shared_part_master.list_name;renderAll(true);saveRecovery();}
}

document.addEventListener('DOMContentLoaded',initApp);
