import { useAuth } from '../context/AuthContext'
import { BucketListView } from '../components/BucketListView'
import { SectionTitle } from '../components/ui'

export default function BucketList() {
  const { isMember } = useAuth()
  return (
    <>
      <SectionTitle script="Together, always" title="Our Bucket List" sub="Everything we dream of doing — and the moments we’ve already lived." />
      <BucketListView editable={isMember} />
    </>
  )
}
