import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'Postari のプライバシーポリシー。個人情報の取扱いについて定めています。',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="プライバシーポリシー"
      subtitle="Privacy Policy"
      effectiveDate="2026年4月19日"
    >
      <p>
        株式会社アテナ（以下「当社」といいます）は、当社が提供する SNS 自動投稿サービス
        「Postari（ポスタリ）」（以下「本サービス」といいます）において、ユーザーの個人情報の取扱いについて、
        以下の通りプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
      </p>

      <h2>第1条 個人情報の定義</h2>
      <p>
        本ポリシーにおいて「個人情報」とは、個人情報の保護に関する法律（以下「個人情報保護法」といいます）に定める個人情報を指し、
        生存する個人に関する情報であって、当該情報に含まれる氏名、メールアドレス、その他の記述等により特定の個人を識別できる情報をいいます。
      </p>

      <h2>第2条 収集する個人情報の種類</h2>
      <table>
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th>収集する情報</th>
            <th>収集方法</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>アカウント情報</td>
            <td>氏名またはニックネーム、メールアドレス、パスワード（暗号化）</td>
            <td>会員登録時</td>
          </tr>
          <tr>
            <td>店舗情報</td>
            <td>店舗名、業態カテゴリ、エリア</td>
            <td>オンボーディング時</td>
          </tr>
          <tr>
            <td>SNS 連携情報</td>
            <td>X・Instagram・Google・WordPress の OAuth トークン（暗号化）</td>
            <td>SNS 連携時</td>
          </tr>
          <tr>
            <td>決済情報</td>
            <td>クレジットカード情報（Stripe が管理。当社は保有しない）</td>
            <td>課金登録時</td>
          </tr>
          <tr>
            <td>投稿データ</td>
            <td>ユーザーがアップロードした画像、入力テキスト、AI が生成した投稿文</td>
            <td>サービス利用時</td>
          </tr>
          <tr>
            <td>利用ログ</td>
            <td>IP アドレス、ブラウザ情報、アクセス日時、投稿履歴</td>
            <td>サービス利用時</td>
          </tr>
          <tr>
            <td>Cookie 情報</td>
            <td>セッション Cookie、ログイン状態の維持に使用する Cookie</td>
            <td>サービス利用時</td>
          </tr>
        </tbody>
      </table>

      <h2>第3条 個人情報の利用目的</h2>
      <ul>
        <li>本サービスの提供・運営・改善</li>
        <li>ユーザー認証およびアカウント管理</li>
        <li>SNS 連携・自動投稿機能の提供</li>
        <li>料金の請求・決済処理</li>
        <li>ユーザーへのサポート対応・問い合わせへの回答</li>
        <li>サービスに関する重要なお知らせの送信</li>
        <li>利用規約違反や不正利用の調査・対応</li>
        <li>サービスの利用状況分析および機能改善</li>
        <li>法令上の義務の履行</li>
      </ul>
      <p className="text-xs text-muted-foreground">
        ※ 当社は、上記の目的以外で個人情報を利用しません。利用目的を変更する場合は、変更前に本ポリシーを改訂の上、ユーザーに通知します。
      </p>

      <h2>第4条 第三者への提供</h2>
      <p>当社は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。</p>
      <ul>
        <li>ユーザーご本人の同意がある場合</li>
        <li>法令に基づく場合（裁判所・警察等の公的機関から法令に基づく開示請求があった場合）</li>
        <li>人の生命・身体・財産の保護のために必要がある場合</li>
        <li>公衆衛生の向上または児童の健全な育成の推進のために必要がある場合</li>
      </ul>

      <h3>業務委託先への提供</h3>
      <p>
        当社は、本サービスの提供に必要な範囲で、以下の業務委託先に個人情報を提供することがあります。委託先には適切な個人情報管理を義務付けます。
      </p>
      <table>
        <thead>
          <tr>
            <th>委託先</th>
            <th>提供する情報</th>
            <th>目的</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Clerk（認証 SaaS）</td>
            <td>メールアドレス、認証情報</td>
            <td>ユーザー認証・アカウント管理</td>
          </tr>
          <tr>
            <td>Stripe（決済 SaaS）</td>
            <td>決済に必要な情報</td>
            <td>課金・決済処理</td>
          </tr>
          <tr>
            <td>Cloudflare R2</td>
            <td>アップロード画像</td>
            <td>画像ストレージ</td>
          </tr>
          <tr>
            <td>Render（インフラ）</td>
            <td>サービス運用に必要なデータ</td>
            <td>サーバーホスティング</td>
          </tr>
          <tr>
            <td>Anthropic（Claude API）</td>
            <td>投稿生成のためのプロンプト</td>
            <td>AI 文章生成</td>
          </tr>
          <tr>
            <td>X（Twitter）API</td>
            <td>投稿文・画像</td>
            <td>SNS 自動投稿</td>
          </tr>
          <tr>
            <td>Google API</td>
            <td>投稿文・画像</td>
            <td>Google ビジネスプロフィール投稿</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">
        ※ Stripe はクレジットカード情報を直接管理します。当社はカード番号等の決済情報を保有しません。
      </p>

      <h2>第5条 Cookie の使用について</h2>
      <p>
        当社は、本サービスの提供にあたり Cookie を使用します。Cookie とは、ウェブサイトがブラウザに保存する小さなテキストファイルです。
      </p>
      <table>
        <thead>
          <tr>
            <th>種類</th>
            <th>目的</th>
            <th>保存期間</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>セッション Cookie</td>
            <td>ログイン状態の維持</td>
            <td>ブラウザを閉じるまで</td>
          </tr>
          <tr>
            <td>認証 Cookie</td>
            <td>ユーザー認証情報の保持</td>
            <td>30 日間</td>
          </tr>
          <tr>
            <td>機能 Cookie</td>
            <td>ユーザーの設定・環境の保持</td>
            <td>1 年間</td>
          </tr>
        </tbody>
      </table>
      <p>
        ブラウザの設定により Cookie を無効にすることができますが、一部の機能が正常に動作しない場合があります。
      </p>

      <h2>第6条 個人情報の安全管理</h2>
      <p>当社は、個人情報の漏洩、滅失、毀損の防止のために以下の安全管理措置を講じます。</p>
      <ul>
        <li>全通信の SSL/TLS 暗号化</li>
        <li>OAuth トークン・パスワードの AES-256 暗号化保存</li>
        <li>アクセス権限の最小化（必要な担当者のみがアクセス可能）</li>
        <li>定期的なセキュリティ監査の実施</li>
        <li>業務委託先との機密保持契約の締結</li>
      </ul>

      <h2>第7条 個人情報の保存期間</h2>
      <table>
        <thead>
          <tr>
            <th>情報の種類</th>
            <th>保存期間</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>アカウント情報</td>
            <td>退会後 90 日間（その後削除）</td>
          </tr>
          <tr>
            <td>投稿履歴・生成文章</td>
            <td>退会後 30 日間（その後削除）</td>
          </tr>
          <tr>
            <td>決済履歴</td>
            <td>法令に定める期間（消費税法等により 7 年間）</td>
          </tr>
          <tr>
            <td>アクセスログ</td>
            <td>取得から 6 ヶ月間</td>
          </tr>
          <tr>
            <td>SNS 連携トークン</td>
            <td>連携解除または退会時に即時削除</td>
          </tr>
        </tbody>
      </table>

      <h2>第8条 ユーザーの権利</h2>
      <table>
        <thead>
          <tr>
            <th>権利</th>
            <th>内容</th>
            <th>対応方法</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>開示請求</td>
            <td>保有する個人情報の開示を求める権利</td>
            <td>お問い合わせフォームよりご連絡ください</td>
          </tr>
          <tr>
            <td>訂正・追加</td>
            <td>不正確な情報の訂正・追加を求める権利</td>
            <td>マイページより変更、または問い合わせ</td>
          </tr>
          <tr>
            <td>利用停止・削除</td>
            <td>個人情報の利用停止・削除を求める権利</td>
            <td>退会手続きまたはお問い合わせ</td>
          </tr>
          <tr>
            <td>第三者提供の停止</td>
            <td>第三者への提供停止を求める権利</td>
            <td>お問い合わせフォームよりご連絡ください</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">
        ※ 請求いただいた場合、本人確認のうえ合理的な期間内に対応します。法令上の義務により対応できない場合はその旨をお知らせします。
      </p>

      <h2>第9条 未成年者の個人情報</h2>
      <p>
        本サービスは 18 歳以上の方を対象としています。18 歳未満の方が個人情報を提供された場合、当社は当該情報を速やかに削除します。
      </p>

      <h2>第10条 外部サービスへのリンク</h2>
      <p>
        本サービスは、X（Twitter）・Instagram・Google・WordPress など外部の SNS サービスと連携します。
        これらの外部サービスにおける個人情報の取扱いは、各サービスのプライバシーポリシーが適用されます。
        当社は外部サービスにおける情報取扱いについて責任を負いません。
      </p>

      <h2>第11条 プライバシーポリシーの変更</h2>
      <p>
        当社は、法令の改正やサービス内容の変更に伴い、本ポリシーを変更することがあります。
        重要な変更を行う場合は、本サービス上での通知またはメールにてユーザーにお知らせします。
        変更後の本ポリシーは、当社ウェブサイトに掲載した時点から効力を生じます。
      </p>

      <h2>第12条 個人情報に関するお問い合わせ窓口</h2>
      <table>
        <tbody>
          <tr>
            <th>事業者名</th>
            <td>株式会社アテナ</td>
          </tr>
          <tr>
            <th>代表者</th>
            <td>山本 和隆</td>
          </tr>
          <tr>
            <th>所在地</th>
            <td>請求があった場合に遅滞なく開示します</td>
          </tr>
          <tr>
            <th>メールアドレス</th>
            <td>
              <a className="text-primary-600 underline" href="mailto:info@athena.asia">
                info@athena.asia
              </a>
            </td>
          </tr>
          <tr>
            <th>ウェブサイト</th>
            <td>https://postari.jp</td>
          </tr>
          <tr>
            <th>受付時間</th>
            <td>平日 10:00〜18:00（土日祝・年末年始を除く）</td>
          </tr>
        </tbody>
      </table>
    </LegalPage>
  )
}
