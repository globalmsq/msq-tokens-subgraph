# PRD: SUT Token Subgraph

## 📋 프로젝트 개요

### 프로젝트명
SUT Token Transaction Subgraph

### 목적
Polygon 네트워크의 SUT 토큰(0x9D3103f1179870374FDeC7E8c6db481798299e4a) 관련 모든 트랜잭션 데이터를 인덱싱하고 GraphQL API로 제공

### 배경
- 현재 블록체인 RPC 직접 호출 방식의 비효율성 해결
- 여러 토큰 운영 시 통합 데이터 관리 체계 구축 필요
- 실시간 토큰 데이터 조회 및 분석 인프라 구축

## 🎯 목표

### 주요 목표
1. SUT 토큰의 모든 Transfer 이벤트 실시간 인덱싱
2. GraphQL을 통한 효율적인 데이터 쿼리 제공
3. 토큰 홀더, 거래량, 트랜잭션 히스토리 추적
4. 무료 Hosted Service를 통한 비용 효율적 운영

### 성공 지표
- 블록 생성 후 30초 이내 데이터 인덱싱
- 99.9% 업타임
- 쿼리 응답시간 < 500ms
- 모든 historical 데이터 정확성 100%

## 🔧 기능 요구사항

### 필수 기능 (P0)

#### 1. Transfer 이벤트 추적
- From/To 주소 기록
- Amount 정확한 기록 (decimals 처리)
- Block number, timestamp 저장
- Transaction hash 연결

#### 2. 토큰 홀더 관리
- 실시간 잔액 업데이트
- 홀더 수 집계
- Top holders 조회 기능
- 첫 거래/마지막 거래 시점 추적

#### 3. 트랜잭션 통계
- 일/주/월별 거래량 집계
- 총 트랜잭션 수
- Unique 주소 수
- 거래 금액별 분포

### 추가 기능 (P1)

#### 4. Approve/Allowance 추적
- Spender별 승인 내역
- Allowance 잔액 관리

#### 5. 고급 분석
- 거래 패턴 분석용 데이터
- 시간대별 활동 지표
- Gas 비용 통계

### 향후 기능 (P2)
- 다중 토큰 지원 확장
- 가격 데이터 통합 (외부 오라클)
- 알림/웹훅 시스템

## 💻 기술 사양

### 스택
```yaml
Blockchain:
  - Network: Polygon (Matic)
  - Token Contract: 0x9D3103f1179870374FDeC7E8c6db481798299e4a
  - Token Standard: ERC-20

Subgraph:
  - Platform: The Graph Protocol
  - Hosting: Hosted Service (무료)
  - Language: AssemblyScript
  - Schema: GraphQL

개발 도구:
  - Graph CLI: v0.71.1+
  - Graph TypeScript: v0.35.1+
  - Node.js: v18+
```

### 데이터 스키마
```graphql
type Token @entity {
  id: ID!                    # Contract address
  symbol: String!
  name: String!
  decimals: Int!
  totalSupply: BigInt!
  transferCount: BigInt!
  holderCount: BigInt!
  totalVolumeTransferred: BigInt!
}

type Account @entity {
  id: ID!                    # Address
  balance: BigInt!
  transferCount: BigInt!
  firstTransferBlock: BigInt!
  lastTransferBlock: BigInt!
  sentTransfers: [Transfer!]! @derivedFrom(field: "from")
  receivedTransfers: [Transfer!]! @derivedFrom(field: "to")
}

type Transfer @entity {
  id: ID!                    # txHash-logIndex
  from: Account!
  to: Account!
  amount: BigInt!
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: String!
  gasPrice: BigInt
  gasUsed: BigInt
}

type DailySnapshot @entity {
  id: ID!                    # day-timestamp
  date: BigInt!
  transferCount: BigInt!
  volumeTransferred: BigInt!
  uniqueAddresses: BigInt!
  newHolders: BigInt!
}
```

### API 엔드포인트 예시
```graphql
# 최근 전송 조회
query RecentTransfers {
  transfers(first: 100, orderBy: blockTimestamp, orderDirection: desc) {
    from { id }
    to { id }
    amount
    blockTimestamp
    transactionHash
  }
}

# Top 홀더 조회
query TopHolders {
  accounts(first: 50, orderBy: balance, orderDirection: desc) {
    id
    balance
    transferCount
  }
}

# 일별 통계
query DailyStats($date: BigInt!) {
  dailySnapshot(id: $date) {
    transferCount
    volumeTransferred
    uniqueAddresses
  }
}
```

## 📦 구현 단계

### Phase 1: 초기 설정 (Day 1-2)
- [ ] Hosted Service 계정 생성
- [ ] Subgraph 프로젝트 생성
- [ ] 로컬 개발 환경 구성
- [ ] SUT 토큰 ABI 확보

### Phase 2: 핵심 기능 개발 (Day 3-5)
- [ ] Schema 정의 (Token, Account, Transfer)
- [ ] Transfer 이벤트 핸들러 구현
- [ ] 잔액 업데이트 로직
- [ ] 기본 쿼리 테스트

### Phase 3: 고급 기능 (Day 6-7)
- [ ] DailySnapshot 구현
- [ ] 통계 집계 로직
- [ ] 성능 최적화
- [ ] 엣지 케이스 처리

### Phase 4: 배포 및 테스트 (Day 8-9)
- [ ] Hosted Service 배포
- [ ] Historical 데이터 sync 검증
- [ ] 쿼리 성능 테스트
- [ ] 문서화

### Phase 5: 통합 (Day 10)
- [ ] 서비스 API 연동
- [ ] 데이터베이스 동기화 스크립트
- [ ] 모니터링 설정

## 🧪 테스트 계획

### 단위 테스트
- Transfer 이벤트 파싱 정확성
- 잔액 계산 로직
- Decimal 처리

### 통합 테스트
- Historical 데이터 완전성
- Reorg 처리
- 대량 데이터 쿼리 성능

### 검증 항목
- [ ] 모든 historical transfers 인덱싱 확인
- [ ] Polygonscan 데이터와 교차 검증
- [ ] 실시간 업데이트 지연 시간 측정
- [ ] 다양한 쿼리 패턴 테스트

## 📈 성과 측정

### KPIs
- 인덱싱 지연: < 30초
- 쿼리 응답 시간: < 500ms
- 데이터 정확도: 100%
- 비용: $0 (Hosted Service)

### 모니터링
- Subgraph Health 상태
- Sync 진행률
- 쿼리 사용량
- 에러율

## 🚀 타임라인

```
Week 1: 개발 및 테스트
- Day 1-2: 환경 설정
- Day 3-5: 핵심 기능
- Day 6-7: 고급 기능

Week 2: 배포 및 통합
- Day 8-9: 배포/검증
- Day 10: 서비스 통합
```

## 📋 체크리스트

### 시작 전 준비
- [ ] GitHub 계정
- [ ] The Graph Hosted Service 가입
- [ ] Node.js 18+ 설치
- [ ] Polygon RPC 엔드포인트 (무료: polygon-rpc.com)

### 개발 준비
- [ ] Graph CLI 설치
- [ ] 프로젝트 구조 생성
- [ ] SUT 토큰 컨트랙트 정보 확인

### 배포 준비
- [ ] Subgraph 이름 결정
- [ ] 테스트 쿼리 작성
- [ ] 문서 작성

## 🎁 기대 효과

1. **개발 효율성**: RPC 호출 대비 100배 빠른 데이터 조회
2. **비용 절감**: 무료 Hosted Service 활용
3. **확장성**: 추가 토큰 쉽게 통합 가능
4. **데이터 품질**: 실시간 정확한 온체인 데이터

## 📚 참고 자료

### 공식 문서
- [The Graph Documentation](https://thegraph.com/docs/)
- [Hosted Service Guide](https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/)
- [GraphQL Schema Design](https://thegraph.com/docs/en/developing/creating-a-subgraph/#the-graphql-schema)

### 토큰 정보
- **Contract Address**: `0x9D3103f1179870374FDeC7E8c6db481798299e4a`
- **Network**: Polygon (Chain ID: 137)
- **Token Standard**: ERC-20
- **Explorer**: [Polygonscan](https://polygonscan.com/token/0x9D3103f1179870374FDeC7E8c6db481798299e4a)

### 개발 리소스
- [Subgraph Examples](https://github.com/graphprotocol/example-subgraph)
- [AssemblyScript Guide](https://www.assemblyscript.org/)
- [Polygon RPC Endpoints](https://polygon-rpc.com/)

## 🤝 팀 & 연락처

### 담당자
- **개발**: [개발자명]
- **프로덕트**: [PM명]
- **운영**: [DevOps명]

### 커뮤니케이션
- **Slack Channel**: #sut-subgraph
- **GitHub Repo**: github.com/[org]/sut-token-subgraph
- **이슈 트래킹**: GitHub Issues

## ⚠️ 리스크 & 대응 방안

### 기술적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| Hosted Service 종료 | High | Decentralized Network 마이그레이션 계획 수립 |
| RPC 엔드포인트 제한 | Medium | 백업 RPC 제공자 확보 |
| 대량 데이터 인덱싱 실패 | Medium | 배치 처리 및 재시도 로직 구현 |
| Reorg 처리 | Low | 충분한 confirmation 대기 |

### 운영 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 쿼리 한도 초과 | Medium | 캐싱 전략 및 Self-hosting 준비 |
| 데이터 불일치 | High | 정기적 검증 스크립트 운영 |
| 성능 저하 | Medium | 쿼리 최적화 및 인덱스 개선 |

## 📝 승인 및 사인오프

- [ ] 프로덕트 매니저 승인
- [ ] 기술 리드 검토
- [ ] 보안 검토
- [ ] 최종 승인

---

**문서 버전**: v1.0.0  
**최종 수정일**: 2024-10-28  
**다음 리뷰**: 2024-11-04
