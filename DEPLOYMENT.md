# Deployment Guide

Complete guide for deploying the MSQ Tokens Subgraph to The Graph Studio.

**Last Updated**: 2025-01-28 (실제 배포 경험 반영)

---

## 🚀 Quick Deploy (5분 완성)

```bash
# 1. Studio에서 subgraph 생성 (웹 브라우저)
# 2. Deploy Key 복사
# 3. 인증 및 배포
graph auth <YOUR_DEPLOY_KEY>
graph deploy <SUBGRAPH_SLUG>
# 4. 버전 입력: v0.0.1
```

---

## 📋 Prerequisites

### 1. The Graph Studio 계정
- 접속: https://thegraph.com/studio/
- 지갑 연결 (MetaMask, WalletConnect 등)
- 로그인 완료

### 2. 개발 환경
- ✅ Node.js v18+
- ✅ Graph CLI 설치: `npm install -g @graphprotocol/graph-cli`
- ✅ 프로젝트 빌드 완료: `npm run build`

---

## 📝 Step-by-Step Deployment

### Step 1: Subgraph Studio에서 생성

**1.1 Studio 접속**
```
https://thegraph.com/studio/
```

**1.2 "Create a Subgraph" 클릭**

**1.3 정보 입력**

| 필드 | 값 | 필수 |
|------|-----|------|
| **Display Name** | `MSQ Tokens Subgraph` | ✅ |
| **Subgraph Slug** | `msq-tokens-subgraph` | ✅ |
| **Subgraph Description** | Multi-token subgraph tracking MSQ, SUT, KWT, P2UC on Polygon | ⚪ |
| **Network** | Polygon | ✅ |
| **Source Code URL** | (GitHub 저장소 URL) | ⚪ |
| **Website URL** | (회사 웹사이트) | ⚪ |

**1.4 "Create Subgraph" 클릭**

**1.5 Deploy Key 복사**
- 생성 후 표시되는 Deploy Key를 복사
- 예: `a1b2c3d4e5f6...`

---

### Step 2: 로컬에서 인증

**명령어:**
```bash
graph auth <YOUR_DEPLOY_KEY>
```

**예시:**
```bash
graph auth a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**성공 메시지:**
```
Deploy key set for https://api.studio.thegraph.com/deploy/
```

**⚠️ 주의:**
- `--product` 플래그는 **사용하지 마세요** (구버전 명령어)
- `--studio` 플래그도 **필요 없습니다** (자동으로 Studio 사용)

---

### Step 3: 빌드 (선택사항)

배포 전 미리 빌드하면 에러를 조기에 발견할 수 있습니다.

```bash
# 타입 생성
npm run codegen

# 빌드
npm run build
```

**빌드 성공 메시지:**
```
✔ Compile subgraph
✔ Write compiled subgraph to build/
Build completed: build/subgraph.yaml
```

---

### Step 4: 배포

**명령어:**
```bash
graph deploy <SUBGRAPH_SLUG>
```

**예시:**
```bash
graph deploy msq-tokens-subgraph
```

**버전 입력:**
```
✔ Which version label to use? (e.g. "v0.0.1") · v0.0.1
```

**배포 진행 과정:**
```
✔ Apply migrations
✔ Load subgraph from subgraph.yaml
✔ Compile subgraph
✔ Write compiled subgraph to build/
✔ Upload subgraph to IPFS

Build completed: QmZrDs8Cb2qZS6UYFug5SVAgpifeagsdoWmUrzLqsDUEbC

Deployed to https://thegraph.com/studio/subgraph/msq-tokens-subgraph

Subgraph endpoints:
Queries (HTTP): https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.1
```

---

## ✅ 배포 확인

### 1. Studio 대시보드 확인

**접속:**
```
https://thegraph.com/studio/subgraph/msq-tokens-subgraph
```

**확인 항목:**

📊 **Indexing Status**
- ⏳ Status: "Syncing" (진행 중)
- ✅ Status: "Synced" (완료)
- 📈 Current Block: 계속 증가
- 💯 Sync Progress: 0% → 100%

⏱️ **예상 동기화 시간:**
- SUT (startBlock: 50000000부터): **2-4시간**
- 블록 수가 많을수록 시간 소요

🏥 **Health Status**
- ✅ "Healthy" - 정상
- ❌ "Unhealthy" - 문제 있음
- 💀 "Failed" - 인덱싱 실패

---

### 2. GraphQL Playground 테스트

**접속:**
Studio 대시보드 → "Playground" 탭

**테스트 쿼리 1: Token 정보**
```graphql
{
  tokens {
    id
    symbol
    name
    decimals
    transferCount
    holderCount
    totalSupply
  }
}
```

**테스트 쿼리 2: 최근 Transfer**
```graphql
{
  transfers(
    first: 10
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    id
    token { symbol }
    from
    to
    amount
    isMint
    isBurn
    blockTimestamp
  }
}
```

**테스트 쿼리 3: SUT 토큰 상세**
```graphql
{
  token(id: "0x98965474ecbec2f532f1f780ee37b0b05f77ca55") {
    symbol
    name
    totalSupply
    transferCount
    holderCount
    isProxy
    isMintable
    mintCount
    burnCount
  }
}
```

---

### 3. API 엔드포인트 테스트

**curl 명령어:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ tokens { id symbol name } }"}' \
  https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.1
```

**예상 응답:**
```json
{
  "data": {
    "tokens": [
      {
        "id": "0x98965474ecbec2f532f1f780ee37b0b05f77ca55",
        "symbol": "SUT",
        "name": "SUPER TRUST"
      }
    ]
  }
}
```

---

## 🔄 업데이트 배포

코드를 수정한 후 재배포:

```bash
# 1. 빌드
npm run build

# 2. 새 버전으로 배포
graph deploy msq-tokens-subgraph

# 3. 버전 증가
✔ Which version label to use? · v0.0.2
```

**버전 규칙:**
- 마이너 수정: v0.0.1 → v0.0.2
- 기능 추가: v0.1.0 → v0.2.0
- 메이저 변경: v1.0.0 → v2.0.0

---

## 🐛 문제 해결

### 에러 1: Schema 에러 - `immutable` 인자 필요

**에러 메시지:**
```
@entity directive requires `immutable` argument
```

**해결:**
`schema.graphql`의 모든 `@entity`에 `immutable` 인자 추가:

```graphql
# ❌ 잘못된 방법
type Token @entity {
  ...
}

# ✅ 올바른 방법
type Token @entity(immutable: false) {
  ...
}
```

**어떤 값을 사용할까?**
- `immutable: true` - Transfer (과거 거래, 변경 없음)
- `immutable: false` - Token, TokenAccount, Snapshot (계속 업데이트됨)

---

### 에러 2: 인증 실패

**에러 메시지:**
```
Error: Nonexistent flag: --product
```

**원인:**
구버전 명령어 사용

**해결:**
```bash
# ❌ 구버전 (사용 금지)
graph auth --product hosted-service <KEY>
graph auth --studio <KEY>

# ✅ 신버전 (올바름)
graph auth <KEY>
```

---

### 에러 3: 빌드 실패

**에러 메시지:**
```
ERROR TS2322: Type '~lib/string/String | null' is not assignable
```

**해결:**
AssemblyScript에서는 nullable 타입 처리를 명시해야 합니다.

```typescript
// ❌ 잘못된 방법
if (config.implementationAddress) {
  token.implementationAddress = Bytes.fromHexString(
    config.implementationAddress
  );
}

// ✅ 올바른 방법 (! 추가)
if (config.implementationAddress) {
  token.implementationAddress = Bytes.fromHexString(
    config.implementationAddress!
  );
}
```

---

### 에러 4: 동기화 실패

**증상:**
- Status: "Failed"
- 에러 로그에 "handler execution error"

**확인 사항:**
1. **Contract Address 확인**
   - Polygonscan에서 주소 재확인
   - 대소문자 정확히 일치해야 함

2. **Start Block 확인**
   - 컨트랙트 배포 블록 이후여야 함
   - 너무 이르면 "contract not found" 에러

3. **핸들러 로직 확인**
   - Studio 로그에서 상세 에러 확인
   - 코드 버그 수정 후 재배포

---

## 📊 모니터링

### 일일 체크리스트

✅ **Sync Status**
- "Synced" 상태 유지
- Current Block이 Polygon 최신 블록과 근접

✅ **Query Performance**
- 응답 시간 < 500ms
- 에러율 < 1%

✅ **Data Integrity**
- 샘플 쿼리 결과 확인
- Polygonscan과 데이터 비교

---

## 🚀 다중 토큰 추가

### MSQ, KWT, P2UC 추가 방법

**1. config/tokens.json 수정**
```json
{
  "symbol": "MSQ",
  "enabled": true  // false → true
}
```

**2. src/utils/constants.ts 수정**
- `getTokenConfig()` 함수에 토큰 케이스 추가

**3. subgraph.yaml에 dataSource 추가**
```yaml
- kind: ethereum/contract
  name: MSQ
  network: matic
  source:
    address: "0x6A8Ec2d9BfBDD20A7F5A4E89D640F7E7cebA4499"
    abi: ERC20
    startBlock: 0  # 실제 배포 블록으로 변경
  mapping:
    file: ./src/mappings/token.ts
    # ... 기존과 동일
```

**4. 재배포**
```bash
npm run build
graph deploy msq-tokens-subgraph
# 버전: v0.1.0 (기능 추가이므로 minor 증가)
```

**⚠️ 주의:**
- 기존 SUT 데이터는 보존됨
- 새 토큰은 각자의 startBlock부터 동기화
- 전체 재동기화 없음 (기존 토큰 영향 없음)

---

## 🌐 Production 배포 (Decentralized Network)

Studio 테스트 완료 후 메인넷 배포:

**1. Studio에서 "Publish" 클릭**
- 큐레이션 시그널 필요 (GRT 토큰)
- 네트워크 수수료 발생

**2. CLI로 배포 (대안)**
```bash
graph publish
```

**3. 네트워크 선택**
- Studio: 무료, 개발/테스트용
- Decentralized Network: 유료, 프로덕션용

---

## 📚 추가 리소스

- **Studio Dashboard**: https://thegraph.com/studio/
- **The Graph Docs**: https://thegraph.com/docs/
- **Discord Support**: https://discord.gg/graphprotocol
- **Status Page**: https://thegraph.com/docs/en/network/explorer/

---

## 🔐 보안 주의사항

❌ **절대 하지 말 것:**
- Deploy Key를 Git에 커밋
- Deploy Key를 공개 저장소에 공유
- 여러 프로젝트에서 같은 키 재사용

✅ **권장 사항:**
- 환경 변수로 Deploy Key 관리
- 정기적으로 키 갱신
- 팀원별로 개별 키 발급

---

## 📝 실제 배포 기록

**First Deployment: v0.0.1**
- Date: 2025-01-28
- Network: Polygon
- Token: SUT (0x98965474EcBeC2F532F1f780ee37b0b05f77Ca55)
- Start Block: 50000000
- Status: ✅ Success
- Sync Time: ~3 hours
- IPFS Hash: QmZrDs8Cb2qZS6UYFug5SVAgpifeagsdoWmUrzLqsDUEbC
- Endpoint: https://api.studio.thegraph.com/query/1704765/msq-tokens-subgraph/v0.0.1

**Issues Encountered:**
1. Schema `immutable` argument - ✅ Fixed
2. AssemblyScript nullable type - ✅ Fixed with `!` assertion

**Next Steps:**
- Add MSQ token (v0.1.0)
- Add KWT token (v0.2.0)
- Add P2UC token (v0.3.0)
- Publish to Decentralized Network (v1.0.0)
