import type { Metadata } from 'next'
import { LegalPage, Notice } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記',
  description: '株式会社アテナ Postari — 特定商取引法第11条に基づく通信販売の表記',
}

export default function TokushohoPage() {
  return (
    <LegalPage
      title="特定商取引法に基づく表記"
      subtitle="Notation based on the Specified Commercial Transaction Act"
      effectiveDate="2026年4月19日"
    >
      <table>
        <tbody>
          <tr>
            <th>販売業者</th>
            <td>株式会社アテナ</td>
          </tr>
          <tr>
            <th>運営統括責任者</th>
            <td>山本 和隆</td>
          </tr>
          <tr>
            <th>所在地</th>
            <td>
              請求があった場合には遅滞なく開示いたします。
              <br />
              お問い合わせフォームよりご連絡ください。
            </td>
          </tr>
          <tr>
            <th>電話番号</th>
            <td>
              請求があった場合には遅滞なく開示いたします。
              <br />
              お問い合わせフォームよりご連絡ください。
            </td>
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
            <th>サービス名</th>
            <td>Postari（ポスタリ）— SNS 自動投稿サービス</td>
          </tr>
          <tr>
            <th>サービス内容</th>
            <td>
              AI 文章生成・SNS 自動投稿機能を提供する SaaS サービス。
              X（Twitter）・Google ビジネスプロフィール・WordPress・Instagram（予定）への自動投稿が可能。
            </td>
          </tr>
          <tr>
            <th>販売価格</th>
            <td>
              <p>
                <strong>【月額プラン（税込）】</strong>
                <br />
                スターター：¥1,980 / 月（投稿 30 件 / 月・1 店舗）
                <br />
                スタンダード：¥5,980 / 月（投稿 100 件 / 月・3 店舗）
                <br />
                プロ：¥14,800 / 月（投稿 400 件 / 月・10 店舗）
              </p>
              <p>
                <strong>【その他】</strong>
                <br />
                無料体験：AI 生成 3 回まで無料（自動投稿は含まない）
                <br />
                従量超過課金：¥150 / 投稿（上限超過時）
                <br />
                年額割引：月額 × 12 ヶ月分を一括払いで 20% 割引
              </p>
              <p className="text-xs text-muted-foreground">※ 価格はすべて税込表示</p>
            </td>
          </tr>
          <tr>
            <th>支払方法</th>
            <td>
              クレジットカード（Visa / Mastercard / American Express / JCB）
              <br />
              ※ Stripe 社の決済システムを利用
            </td>
          </tr>
          <tr>
            <th>支払時期</th>
            <td>
              プラン登録時に初回課金。以降は毎月同日に自動更新・自動課金。
              <br />
              年額プランは登録時に 12 ヶ月分を一括課金。
              <br />
              従量超過分は翌月の更新時に合算請求。
            </td>
          </tr>
          <tr>
            <th>サービス提供時期</th>
            <td>決済完了後、即時ご利用いただけます。</td>
          </tr>
          <tr>
            <th>動作環境</th>
            <td>
              推奨ブラウザ：Google Chrome / Safari / Microsoft Edge（各最新バージョン）
              <br />
              インターネット接続環境が必要です。
              <br />
              スマートフォン（iOS / Android）のブラウザでも利用可能。
            </td>
          </tr>
          <tr>
            <th>キャンセル・解約</th>
            <td>
              マイページの「プラン設定」より、月次更新日の前日 23:59 までに解約手続きを完了することで、次月以降の課金を停止できます。
              <br />
              解約後も契約期間終了まではサービスをご利用いただけます。
              <br />
              年額プランの途中解約による日割り返金は行いません。
            </td>
          </tr>
          <tr>
            <th>返品・返金</th>
            <td>
              サービスの性質上、提供済みの期間分の返金は原則として行いません。
              ただし、システム障害等、当社の責に帰すべき事由によりサービスが提供できなかった場合はこの限りではありません。
              その場合は個別にご相談ください。
            </td>
          </tr>
          <tr>
            <th>特別条件</th>
            <td>
              無料体験は AI 文章生成 3 回まで無料でご利用いただけます。
              自動投稿機能はプランご加入後にご利用いただけます。
              <br />
              プランのアップグレードは即時適用されます。ダウングレードは次回更新日から適用されます。
            </td>
          </tr>
        </tbody>
      </table>

      <Notice>
        所在地・電話番号については、ユーザーから開示請求があった場合、遅滞なく（通常 5 営業日以内に）開示いたします。
        info@athena.asia までご連絡ください。
      </Notice>

      <Notice tone="warn">
        本表記は特定商取引法第 11 条（通信販売についての広告）に基づくものです。
      </Notice>
    </LegalPage>
  )
}
